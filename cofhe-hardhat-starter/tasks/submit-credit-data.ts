import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Encryptable, FheTypes } from '@cofhe/sdk'
import { getDeployment, createCofheClient } from './utils'

task('submit-credit-data', 'Submit encrypted credit signals to CreditScoreRegistry')
  .addParam('balance',    'Wallet balance score 0-100',    80, types.int)
  .addParam('txfreq',     'Transaction frequency 0-100',   70, types.int)
  .addParam('repayment',  'Repayment history score 0-100', 90, types.int)
  .addParam('debtratio',  'Existing debt ratio 0-100',     20, types.int)
  .setAction(async (args, hre: HardhatRuntimeEnvironment) => {
    const { ethers, network } = hre

    const registryAddress = getDeployment(network.name, 'CreditScoreRegistry')
    if (!registryAddress) {
      console.error(`No CreditScoreRegistry found for ${network.name}. Run deploy-credit first.`)
      return
    }

    const [signer] = await ethers.getSigners()
    console.log(`Using account: ${signer.address}`)

    const client = await createCofheClient(hre, signer)

    // Encrypt all four signals
    const encrypted = await client.encryptInputs([
      Encryptable.uint32(BigInt(args.balance)),
      Encryptable.uint32(BigInt(args.txfreq)),
      Encryptable.uint32(BigInt(args.repayment)),
      Encryptable.uint32(BigInt(args.debtratio)),
    ]).execute()

    console.log('Submitting encrypted credit data...')
    console.log(`  balance=${args.balance}, txFreq=${args.txfreq}, repayment=${args.repayment}, debt=${args.debtratio}`)

    const Registry = await ethers.getContractFactory('CreditScoreRegistry')
    const registry = Registry.attach(registryAddress)

    const tx = await (registry as any).connect(signer).submitCreditData(
      encrypted[0],
      encrypted[1],
      encrypted[2],
      encrypted[3],
    )
    await tx.wait()
    console.log(`Credit data submitted. Tx: ${tx.hash}`)

    // Retrieve and decrypt our own score
    const scoreTx = await (registry as any).connect(signer).getMyScore()
    await scoreTx.wait()

    const scoreHandle = await (registry as any).connect(signer).getMyScore.staticCall()
    const decrypted = await client.decryptForView(scoreHandle, FheTypes.Uint32).execute()

    console.log(`Expected score: ${args.balance*25 + args.txfreq*20 + args.repayment*40 + (100-args.debtratio)*15}`)
    console.log(`Decrypted score from FHE: ${decrypted} / 10000`)
  })
