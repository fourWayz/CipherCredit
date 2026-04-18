import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { saveDeployment } from './utils'

task('deploy-credit', 'Deploy CreditScoreRegistry and LendingPool').setAction(
  async (_, hre: HardhatRuntimeEnvironment) => {
    const { ethers, network } = hre

    console.log(`Deploying credit protocol to ${network.name}...`)
    const [deployer] = await ethers.getSigners()
    console.log(`Deploying with account: ${deployer.address}`)

    // 1. CreditScoreRegistry
    const Registry = await ethers.getContractFactory('CreditScoreRegistry')
    const registry = await Registry.deploy()
    await registry.waitForDeployment()
    const registryAddress = await registry.getAddress()
    console.log(`CreditScoreRegistry deployed to: ${registryAddress}`)
    saveDeployment(network.name, 'CreditScoreRegistry', registryAddress)

    // 2. LendingPool (depends on registry address)
    const Pool = await ethers.getContractFactory('LendingPool')
    const pool = await Pool.deploy(registryAddress)
    await pool.waitForDeployment()
    const poolAddress = await pool.getAddress()
    console.log(`LendingPool deployed to: ${poolAddress}`)
    saveDeployment(network.name, 'LendingPool', poolAddress)

    return { registryAddress, poolAddress }
  },
)
