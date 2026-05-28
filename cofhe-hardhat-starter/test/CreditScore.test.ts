import { loadFixture, time } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import hre from 'hardhat'
import { Encryptable, FheTypes } from '@cofhe/sdk'
import { expect } from 'chai'

const TASK_COFHE_MOCKS_DEPLOY = 'task:cofhe-mocks:deploy'

function expectedScore(balance: number, txFreq: number, repayment: number, debt: number) {
  return balance * 25 + txFreq * 20 + repayment * 40 + (100 - debt) * 15
}

describe('CreditScoreRegistry', function () {
  async function deployFixture() {
    await hre.run(TASK_COFHE_MOCKS_DEPLOY)
    const [deployer, borrower, lender] = await hre.ethers.getSigners()

    const Registry = await hre.ethers.getContractFactory('CreditScoreRegistry')
    const registry = await Registry.connect(deployer).deploy()

    const NFT = await hre.ethers.getContractFactory('CreditTierNFT')
    const nft = await NFT.connect(deployer).deploy(await registry.getAddress())

    const Pool = await hre.ethers.getContractFactory('LendingPool')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pool = await (Pool as any).connect(deployer).deploy(
      await registry.getAddress(),
      await nft.getAddress(),
      deployer.address,
    )

    const borrowerClient = await hre.cofhe.createClientWithBatteries(borrower)
    const lenderClient   = await hre.cofhe.createClientWithBatteries(lender)

    return { registry, nft, pool, deployer, borrower, lender, borrowerClient, lenderClient }
  }

  //  Data submission 

  describe('Credit data submission', function () {
    it('should accept encrypted inputs and store them', async function () {
      const { registry, borrower, borrowerClient } = await loadFixture(deployFixture)

      const encrypted = await borrowerClient.encryptInputs([
        Encryptable.uint32(80n),
        Encryptable.uint32(70n),
        Encryptable.uint32(90n),
        Encryptable.uint32(20n),
      ]).execute()

      await registry.connect(borrower).submitCreditData(
        encrypted[0], encrypted[1], encrypted[2], encrypted[3]
      )

      expect(await registry.hasData(borrower.address)).to.be.true
    })

    it('should record the submission timestamp', async function () {
      const { registry, borrower, borrowerClient } = await loadFixture(deployFixture)

      const before = BigInt(Math.floor(Date.now() / 1000))
      const encrypted = await borrowerClient.encryptInputs([
        Encryptable.uint32(50n), Encryptable.uint32(50n),
        Encryptable.uint32(50n), Encryptable.uint32(50n),
      ]).execute()

      await registry.connect(borrower).submitCreditData(
        encrypted[0], encrypted[1], encrypted[2], encrypted[3]
      )

      const ts = await registry.dataUpdatedAt(borrower.address)
      expect(ts).to.be.gte(before)
    })

    it('should report hasData=false for address with no submission', async function () {
      const { registry, lender } = await loadFixture(deployFixture)
      expect(await registry.hasData(lender.address)).to.be.false
    })
  })

  //  Score computation ─

  describe('Score computation', function () {
    it('should compute the correct encrypted score — perfect borrower', async function () {
      const { registry, borrower, borrowerClient } = await loadFixture(deployFixture)

      const balance = 100n, txFreq = 100n, repayment = 100n, debt = 0n
      const encrypted = await borrowerClient.encryptInputs([
        Encryptable.uint32(balance),
        Encryptable.uint32(txFreq),
        Encryptable.uint32(repayment),
        Encryptable.uint32(debt),
      ]).execute()

      await registry.connect(borrower).submitCreditData(
        encrypted[0], encrypted[1], encrypted[2], encrypted[3]
      )

      const scoreTx = await registry.connect(borrower).getMyScore()
      await scoreTx.wait()
      const scoreHandle = await (registry as any).connect(borrower).getMyScore.staticCall()

      const plaintext = await hre.cofhe.mocks.getPlaintext(scoreHandle)
      const expected   = expectedScore(100, 100, 100, 0)
      expect(plaintext).to.equal(BigInt(expected)) // 10000
    })

    it('should compute the correct encrypted score — average borrower', async function () {
      const { registry, borrower, borrowerClient } = await loadFixture(deployFixture)

      // score = 80*25 + 70*20 + 90*40 + (100-20)*15 = 2000+1400+3600+1200 = 8200
      const balance = 80n, txFreq = 70n, repayment = 90n, debt = 20n
      const encrypted = await borrowerClient.encryptInputs([
        Encryptable.uint32(balance),
        Encryptable.uint32(txFreq),
        Encryptable.uint32(repayment),
        Encryptable.uint32(debt),
      ]).execute()

      await registry.connect(borrower).submitCreditData(
        encrypted[0], encrypted[1], encrypted[2], encrypted[3]
      )

      const scoreTx = await registry.connect(borrower).getMyScore()
      await scoreTx.wait()
      const scoreHandle = await (registry as any).connect(borrower).getMyScore.staticCall()

      const plaintext = await hre.cofhe.mocks.getPlaintext(scoreHandle)
      expect(plaintext).to.equal(BigInt(expectedScore(80, 70, 90, 20)))
    })

    it('should recompute score after data update', async function () {
      const { registry, borrower, borrowerClient } = await loadFixture(deployFixture)

      const enc1 = await borrowerClient.encryptInputs([
        Encryptable.uint32(50n), Encryptable.uint32(50n),
        Encryptable.uint32(50n), Encryptable.uint32(50n),
      ]).execute()
      await registry.connect(borrower).submitCreditData(enc1[0], enc1[1], enc1[2], enc1[3])

      const enc2 = await borrowerClient.encryptInputs([
        Encryptable.uint32(100n), Encryptable.uint32(100n),
        Encryptable.uint32(100n), Encryptable.uint32(0n),
      ]).execute()
      await registry.connect(borrower).submitCreditData(enc2[0], enc2[1], enc2[2], enc2[3])

      const scoreTx = await registry.connect(borrower).getMyScore()
      await scoreTx.wait()
      const scoreHandle = await (registry as any).connect(borrower).getMyScore.staticCall()
      const plaintext = await hre.cofhe.mocks.getPlaintext(scoreHandle)

      expect(plaintext).to.equal(10000n) // updated data → perfect score
    })
  })

  //  Lender approvals ─

  describe('Lender approval', function () {
    async function submitData(registry: any, borrower: any, borrowerClient: any) {
      // 8200 score — above 7000 threshold
      const encrypted = await borrowerClient.encryptInputs([
        Encryptable.uint32(80n), Encryptable.uint32(70n),
        Encryptable.uint32(90n), Encryptable.uint32(20n),
      ]).execute()
      await registry.connect(borrower).submitCreditData(
        encrypted[0], encrypted[1], encrypted[2], encrypted[3]
      )
    }

    it('should grant an approval and set hasApprovalFor', async function () {
      const { registry, borrower, lender, borrowerClient } = await loadFixture(deployFixture)
      await submitData(registry, borrower, borrowerClient)

      await registry.connect(borrower).grantLenderApproval(lender.address, 7000)
      expect(await registry.hasApprovalFor(borrower.address, lender.address)).to.be.true
    })

    it('should record the threshold used', async function () {
      const { registry, borrower, lender, borrowerClient } = await loadFixture(deployFixture)
      await submitData(registry, borrower, borrowerClient)

      await registry.connect(borrower).grantLenderApproval(lender.address, 7500)
      expect(await registry.getApprovalThreshold(borrower.address, lender.address)).to.equal(7500)
    })

    it('approval ebool should be 1 (approved) when score exceeds threshold', async function () {
      const { registry, borrower, lender, borrowerClient } = await loadFixture(deployFixture)
      await submitData(registry, borrower, borrowerClient)   // score = 8200

      await registry.connect(borrower).grantLenderApproval(lender.address, 7000)

      const approvalHandle = await registry.connect(lender).getLenderApproval(borrower.address)
      const plaintext = await hre.cofhe.mocks.getPlaintext(approvalHandle)
      expect(plaintext).to.equal(1n) // approved
    })

    it('approval ebool should be 0 (denied) when score is below threshold', async function () {
      const { registry, borrower, lender, borrowerClient } = await loadFixture(deployFixture)

      // Low-quality borrower — score = 50*25+50*20+50*40+50*15 = 5000
      const enc = await borrowerClient.encryptInputs([
        Encryptable.uint32(50n), Encryptable.uint32(50n),
        Encryptable.uint32(50n), Encryptable.uint32(50n),
      ]).execute()
      await registry.connect(borrower).submitCreditData(enc[0], enc[1], enc[2], enc[3])

      await registry.connect(borrower).grantLenderApproval(lender.address, 7000)

      const approvalHandle = await registry.connect(lender).getLenderApproval(borrower.address)
      const plaintext = await hre.cofhe.mocks.getPlaintext(approvalHandle)
      expect(plaintext).to.equal(0n) // denied
    })

    it('non-lender should not read the approval handle', async function () {
      const { registry, borrower, lender, deployer, borrowerClient } = await loadFixture(deployFixture)
      await submitData(registry, borrower, borrowerClient)
      await registry.connect(borrower).grantLenderApproval(lender.address, 7000)

      await expect(
        registry.connect(deployer).getLenderApproval(borrower.address)
      ).to.be.revertedWith('CreditScoreRegistry: no approval granted to caller')
    })

    it('should revert grantLenderApproval when no data submitted', async function () {
      const { registry, borrower, lender } = await loadFixture(deployFixture)
      await expect(
        registry.connect(borrower).grantLenderApproval(lender.address, 7000)
      ).to.be.revertedWith('CreditScoreRegistry: no credit data submitted')
    })
  })

  //  On-chain approval reveal (3-step) ──

  describe('On-chain approval reveal', function () {
    it('should reveal an approved result through the 3-step flow', async function () {
      const { registry, borrower, lender, borrowerClient } = await loadFixture(deployFixture)

      // Submit good data (score = 8200)
      const enc = await borrowerClient.encryptInputs([
        Encryptable.uint32(80n), Encryptable.uint32(70n),
        Encryptable.uint32(90n), Encryptable.uint32(20n),
      ]).execute()
      await registry.connect(borrower).submitCreditData(enc[0], enc[1], enc[2], enc[3])
      await registry.connect(borrower).grantLenderApproval(lender.address, 7000)

      // Step 1: allow public decrypt
      await registry.connect(borrower).allowApprovalPublic(lender.address)

      // Step 2: decrypt via CoFHE threshold network
      const approvalHandle = await registry.connect(lender).getLenderApproval(borrower.address)
      const result = await borrowerClient.decryptForTx(approvalHandle).withoutPermit().execute()

      // Step 3: publish result on-chain
      await registry.connect(borrower).publishApprovalResult(
        borrower.address, lender.address, result.decryptedValue, result.signature
      )

      // Read the revealed result
      const revealed = await registry.getRevealedApproval(borrower.address, lender.address)
      expect(revealed).to.be.true
    })
  })
})

describe('LendingPool', function () {
  async function deployFixture() {
    await hre.run(TASK_COFHE_MOCKS_DEPLOY)
    const [deployer, provider, borrower, liquidator] = await hre.ethers.getSigners()

    const Registry = await hre.ethers.getContractFactory('CreditScoreRegistry')
    const registry = await Registry.connect(deployer).deploy()

    const NFT = await hre.ethers.getContractFactory('CreditTierNFT')
    const nft = await NFT.connect(deployer).deploy(await registry.getAddress())

    const Pool = await hre.ethers.getContractFactory('LendingPool')
    // Wave 4: constructor now requires feeRecipient (deployer collects fees in tests)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pool = await (Pool as any).connect(deployer).deploy(
      await registry.getAddress(),
      await nft.getAddress(),
      deployer.address,
    )

    const borrowerClient = await hre.cofhe.createClientWithBatteries(borrower)

    return { registry, nft, pool, deployer, provider, borrower, liquidator, borrowerClient }
  }

  it('should accept deposits and mint shares 1:1 on first deposit', async function () {
    const { pool, provider } = await loadFixture(deployFixture)
    await pool.connect(provider).deposit({ value: hre.ethers.parseEther('10') })
    expect(await pool.providerShares(provider.address)).to.equal(hre.ethers.parseEther('10'))
    expect(await pool.totalLPBalance()).to.equal(hre.ethers.parseEther('10'))
  })

  it('providerBalance should equal deposit before any loans', async function () {
    const { pool, provider } = await loadFixture(deployFixture)
    await pool.connect(provider).deposit({ value: hre.ethers.parseEther('10') })
    expect(await pool.providerBalance(provider.address)).to.equal(hre.ethers.parseEther('10'))
  })

  it('should issue a standard loan at 150% collateral', async function () {
    const { pool, provider, borrower } = await loadFixture(deployFixture)

    await pool.connect(provider).deposit({ value: hre.ethers.parseEther('10') })

    const principal  = hre.ethers.parseEther('1')
    const collateral = hre.ethers.parseEther('1.5') // 150%

    await pool.connect(borrower).requestLoan(principal, false, { value: collateral })
    const loan = await pool.loans(borrower.address)
    expect(loan.active).to.be.true
    expect(loan.creditApproved).to.be.false
  })

  it('loan dueDate should be set 30 days from issuedAt', async function () {
    const { pool, provider, borrower } = await loadFixture(deployFixture)
    await pool.connect(provider).deposit({ value: hre.ethers.parseEther('10') })

    const before = BigInt(Math.floor(Date.now() / 1000))
    await pool.connect(borrower).requestLoan(
      hre.ethers.parseEther('1'), false,
      { value: hre.ethers.parseEther('1.5') }
    )
    const loan    = await pool.loans(borrower.address)
    const thirtyD = 30n * 24n * 3600n
    expect(loan.dueDate).to.be.gte(before + thirtyD)
  })

  it('should deny a standard loan with insufficient collateral', async function () {
    const { pool, provider, borrower } = await loadFixture(deployFixture)
    await pool.connect(provider).deposit({ value: hre.ethers.parseEther('10') })

    const principal  = hre.ethers.parseEther('1')
    const collateral = hre.ethers.parseEther('1') // only 100% — not enough

    await expect(
      pool.connect(borrower).requestLoan(principal, false, { value: collateral })
    ).to.be.revertedWith('LendingPool: insufficient collateral')
  })

  it('should repay a loan and return collateral', async function () {
    const { pool, provider, borrower } = await loadFixture(deployFixture)
    await pool.connect(provider).deposit({ value: hre.ethers.parseEther('10') })

    const principal  = hre.ethers.parseEther('1')
    const collateral = hre.ethers.parseEther('1.5')

    await pool.connect(borrower).requestLoan(principal, false, { value: collateral })
    expect((await pool.loans(borrower.address)).active).to.be.true

    await pool.connect(borrower).repayLoan({ value: principal })
    expect((await pool.loans(borrower.address)).active).to.be.false
  })

  it('repaymentCount should increment after each repay', async function () {
    const { pool, provider, borrower } = await loadFixture(deployFixture)
    await pool.connect(provider).deposit({ value: hre.ethers.parseEther('10') })

    expect(await pool.repaymentCount(borrower.address)).to.equal(0n)

    // First loan + repay
    await pool.connect(borrower).requestLoan(
      hre.ethers.parseEther('1'), false, { value: hre.ethers.parseEther('1.5') }
    )
    await pool.connect(borrower).repayLoan({ value: hre.ethers.parseEther('1') })
    expect(await pool.repaymentCount(borrower.address)).to.equal(1n)

    // Second loan + repay
    await pool.connect(borrower).requestLoan(
      hre.ethers.parseEther('1'), false, { value: hre.ethers.parseEther('1.5') }
    )
    await pool.connect(borrower).repayLoan({ value: hre.ethers.parseEther('1') })
    expect(await pool.repaymentCount(borrower.address)).to.equal(2n)
  })

  it('should liquidate an overdue loan and pay bounty to liquidator', async function () {
    const { pool, provider, borrower, liquidator } = await loadFixture(deployFixture)
    await pool.connect(provider).deposit({ value: hre.ethers.parseEther('10') })

    const principal  = hre.ethers.parseEther('1')
    const collateral = hre.ethers.parseEther('1.5')
    await pool.connect(borrower).requestLoan(principal, false, { value: collateral })

    // Should revert before deadline
    await expect(
      pool.connect(liquidator).liquidate(borrower.address)
    ).to.be.revertedWith('LendingPool: loan not yet due')

    // Fast-forward 31 days
    await time.increase(31 * 24 * 3600)

    const liquidatorBefore = await hre.ethers.provider.getBalance(liquidator.address)
    const tx = await pool.connect(liquidator).liquidate(borrower.address)
    const receipt = await tx.wait()
    const gasUsed = receipt!.gasUsed * receipt!.gasPrice

    // Liquidator received 5% bounty (0.075 ETH from 1.5 ETH collateral)
    const liquidatorAfter = await hre.ethers.provider.getBalance(liquidator.address)
    const bounty = hre.ethers.parseEther('1.5') * 5n / 100n
    expect(liquidatorAfter - liquidatorBefore + gasUsed).to.be.closeTo(bounty, hre.ethers.parseEther('0.001'))

    // Loan cleared, defaultCount incremented
    expect((await pool.loans(borrower.address)).active).to.be.false
    expect(await pool.defaultCount(borrower.address)).to.equal(1n)
  })

  it('maxBorrowable should reflect pool liquidity', async function () {
    const { pool, provider, borrower } = await loadFixture(deployFixture)
    await pool.connect(provider).deposit({ value: hre.ethers.parseEther('10') })

    // BASE_LIMIT_BPS = 5000 → 50% of 10 ETH = 5 ETH (no NFT tier)
    const limit = await pool.maxBorrowable(borrower.address)
    expect(limit).to.equal(hre.ethers.parseEther('5'))
  })

  it('collateralRequired should return 150% for standard and 110% for credit', async function () {
    const { pool } = await loadFixture(deployFixture)
    const principal = hre.ethers.parseEther('1')
    expect(await pool.collateralRequired(principal, false)).to.equal(hre.ethers.parseEther('1.5'))
    expect(await pool.collateralRequired(principal, true)).to.equal(hre.ethers.parseEther('1.1'))
  })

  it('providerBalance increases after a repayment (LP earns yield)', async function () {
    const { pool, provider, borrower } = await loadFixture(deployFixture)
    await pool.connect(provider).deposit({ value: hre.ethers.parseEther('10') })

    const balanceBefore = await pool.providerBalance(provider.address)

    // Borrow and immediately repay with a small overpayment to simulate interest
    await pool.connect(borrower).requestLoan(
      hre.ethers.parseEther('1'), false, { value: hre.ethers.parseEther('1.5') }
    )
    // Advance time so interest accrues (1 day)
    await time.increase(24 * 3600)

    const interest = await pool.getAccruedInterest(borrower.address)
    const totalDue = hre.ethers.parseEther('1') + interest
    await pool.connect(borrower).repayLoan({ value: totalDue })

    const balanceAfter = await pool.providerBalance(provider.address)
    // Provider balance should have grown (90% of interest credited to LP pool)
    expect(balanceAfter).to.be.gt(balanceBefore)
  })

  it('lpUtilisation should reflect outstanding loans as % of LP capital', async function () {
    const { pool, provider, borrower } = await loadFixture(deployFixture)
    await pool.connect(provider).deposit({ value: hre.ethers.parseEther('10') })

    // No loans → 0% utilisation
    expect(await pool.lpUtilisation()).to.equal(0n)

    await pool.connect(borrower).requestLoan(
      hre.ethers.parseEther('1'), false, { value: hre.ethers.parseEther('1.5') }
    )

    // 1 ETH borrowed from 10 ETH LP pool → 10% utilisation (1000 bps)
    expect(await pool.lpUtilisation()).to.equal(1_000n)
  })

  it('protocol fee accumulates in unclaimedFees after repayment', async function () {
    const { pool, provider, borrower, deployer } = await loadFixture(deployFixture)
    await pool.connect(provider).deposit({ value: hre.ethers.parseEther('10') })

    await pool.connect(borrower).requestLoan(
      hre.ethers.parseEther('1'), false, { value: hre.ethers.parseEther('1.5') }
    )
    await time.increase(24 * 3600)

    const interest = await pool.getAccruedInterest(borrower.address)
    const totalDue = hre.ethers.parseEther('1') + interest
    await pool.connect(borrower).repayLoan({ value: totalDue })

    const fees = await pool.unclaimedFees()
    // 10% of interest should be in unclaimedFees
    const expectedFee = (interest * 1_000n) / 10_000n
    expect(fees).to.equal(expectedFee)

    // feeRecipient (deployer) can claim
    const before = await hre.ethers.provider.getBalance(deployer.address)
    const tx      = await pool.connect(deployer).claimFees()
    const receipt = await tx.wait()
    const gasUsed = receipt!.gasUsed * receipt!.gasPrice
    const after   = await hre.ethers.provider.getBalance(deployer.address)
    expect(after - before + gasUsed).to.equal(fees)
    expect(await pool.unclaimedFees()).to.equal(0n)
  })
})

describe('CreditScoreRegistry — verifyCreditTier', function () {
  async function deployFixture() {
    await hre.run(TASK_COFHE_MOCKS_DEPLOY)
    const [deployer, borrower] = await hre.ethers.getSigners()

    const Registry = await hre.ethers.getContractFactory('CreditScoreRegistry')
    const registry = await Registry.connect(deployer).deploy()

    const borrowerClient = await hre.cofhe.createClientWithBatteries(borrower)
    return { registry, deployer, borrower, borrowerClient }
  }

  it('returns false when borrower has no data', async function () {
    const { registry, borrower } = await loadFixture(deployFixture)
    expect(await registry.verifyCreditTier(borrower.address, 1, 0)).to.be.false
  })

  it('returns true for Bronze (minTier=1) after rate is revealed for a credit-approved borrower', async function () {
    const { registry, borrower, borrowerClient } = await loadFixture(deployFixture)

    // score = 80*25+70*20+90*40+80*15 = 2000+1400+3600+1200 = 8200 → Bronze+
    const enc = await borrowerClient.encryptInputs([
      Encryptable.uint32(80n), Encryptable.uint32(70n),
      Encryptable.uint32(90n), Encryptable.uint32(20n),
    ]).execute()
    await registry.connect(borrower).submitCreditData(enc[0], enc[1], enc[2], enc[3])
    await registry.connect(borrower).computePersonalRate()
    // set a Bronze-tier rate directly (1 400 bps > 1 033, ≤ 1 383 → actually Silver)
    await registry.connect(borrower).setPersonalRateDirect(1_200) // Silver-tier rate

    // minTier 1 = Bronze, maxAge 0 = no freshness check
    expect(await registry.verifyCreditTier(borrower.address, 1, 0)).to.be.true
    // minTier 3 = Gold — should fail for Silver rate
    expect(await registry.verifyCreditTier(borrower.address, 3, 0)).to.be.false
  })

  it('returns false when data is older than maxAge', async function () {
    const { registry, borrower, borrowerClient } = await loadFixture(deployFixture)

    const enc = await borrowerClient.encryptInputs([
      Encryptable.uint32(80n), Encryptable.uint32(70n),
      Encryptable.uint32(90n), Encryptable.uint32(20n),
    ]).execute()
    await registry.connect(borrower).submitCreditData(enc[0], enc[1], enc[2], enc[3])
    await registry.connect(borrower).computePersonalRate()
    await registry.connect(borrower).setPersonalRateDirect(1_200)

    // Fast-forward 31 days — data is now stale
    await time.increase(31 * 24 * 3600)

    const thirtyDayWindow = 30 * 24 * 3600
    expect(await registry.verifyCreditTier(borrower.address, 1, thirtyDayWindow)).to.be.false
    // No freshness check → still passes
    expect(await registry.verifyCreditTier(borrower.address, 1, 0)).to.be.true
  })
})
