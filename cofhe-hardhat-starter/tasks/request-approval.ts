import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getDeployment, createCofheClient } from './utils'

task('request-approval', 'Grant a lender an encrypted credit approval and reveal it on-chain')
  .addParam('lender',    'Lender address (or "pool" to use deployed LendingPool)')
  .addParam('threshold', 'Minimum score out of 10000', 7000, types.int)
  .setAction(async (args, hre: HardhatRuntimeEnvironment) => {
    const { ethers, network } = hre

    const registryAddress = getDeployment(network.name, 'CreditScoreRegistry')
    if (!registryAddress) {
      console.error('No CreditScoreRegistry found. Run deploy-credit first.')
      return
    }

    let lenderAddress = args.lender
    if (args.lender === 'pool') {
      const poolAddress = getDeployment(network.name, 'LendingPool')
      if (!poolAddress) {
        console.error('No LendingPool found. Run deploy-credit first.')
        return
      }
      lenderAddress = poolAddress
    }

    const [signer] = await ethers.getSigners()
    console.log(`Borrower: ${signer.address}`)
    console.log(`Lender:   ${lenderAddress}`)
    console.log(`Threshold: ${args.threshold} / 10000`)

    const client = await createCofheClient(hre, signer)
    const Registry = await ethers.getContractFactory('CreditScoreRegistry')
    const registry = Registry.attach(registryAddress)

    // Step 1: Grant the lender an encrypted approval
    console.log('\n[1/3] Granting lender approval (FHE comparison on encrypted score)...')
    const grantTx = await (registry as any).connect(signer).grantLenderApproval(lenderAddress, args.threshold)
    await grantTx.wait()
    console.log(`      Tx: ${grantTx.hash}`)

    // Step 2: Allow public decryption of the approval handle
    console.log('[2/3] Permitting on-chain decryption...')
    const allowTx = await (registry as any).connect(signer).allowApprovalPublic(lenderAddress)
    await allowTx.wait()
    console.log(`      Tx: ${allowTx.hash}`)

    // Step 3: Decrypt via CoFHE SDK and publish result on-chain
    console.log('[3/3] Decrypting via CoFHE threshold network and publishing result...')
    const approvalHandle = await (registry as any).connect(signer).getLenderApproval.staticCall(
      { from: lenderAddress }
    )

    const result = await client.decryptForTx(approvalHandle).withoutPermit().execute()

    const publishTx = await (registry as any).connect(signer).publishApprovalResult(
      signer.address,
      lenderAddress,
      result.decryptedValue,
      result.signature,
    )
    await publishTx.wait()
    console.log(`      Tx: ${publishTx.hash}`)

    const revealed = await (registry as any).getRevealedApproval(signer.address, lenderAddress)
    console.log(`\nApproval result: ${revealed ? '✅ APPROVED' : '❌ DENIED'}`)
    console.log(revealed
      ? `Borrower qualifies for reduced collateral (${110}% vs ${150}%)`
      : `Borrower does not meet the ${args.threshold}/10000 threshold`)
  })
