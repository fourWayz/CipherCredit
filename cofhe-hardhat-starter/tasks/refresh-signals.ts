import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const STALE_THRESHOLD = 30 * 24 * 60 * 60 // 30 days in seconds

task('refresh-signals', 'Detect borrowers with stale credit signals')
  .addParam('borrowers', 'Comma-separated list of borrower addresses to check')
  .addOptionalParam('staleDays', 'Days after which signals are considered stale (default: 30)', '30')
  .setAction(async (args, hre: HardhatRuntimeEnvironment) => {
    const { ethers, network } = hre
    const [signer] = await ethers.getSigners()

    const staleSeconds = parseInt(args.staleDays, 10) * 24 * 60 * 60
    const addresses: string[] = args.borrowers.split(',').map((a: string) => a.trim()).filter(Boolean)

    if (addresses.length === 0) {
      console.error('No addresses provided.')
      return
    }

    console.log(`\nChecking ${addresses.length} borrower(s) on ${network.name}`)
    console.log(`Stale threshold: ${args.staleDays} days\n`)

    // Load registry contract
    const deployments = await loadDeployments(network.name)
    if (!deployments.CreditScoreRegistry) {
      throw new Error(`No CreditScoreRegistry deployment found for ${network.name}. Run deploy-credit first.`)
    }

    const registryArtifact = await hre.artifacts.readArtifact('CreditScoreRegistry')
    const registry = new ethers.Contract(
      deployments.CreditScoreRegistry,
      registryArtifact.abi,
      signer,
    )

    const now = Math.floor(Date.now() / 1000)
    const stale: string[]   = []
    const fresh: string[]   = []
    const noData: string[]  = []

    for (const addr of addresses) {
      const hasData: boolean  = await registry.hasData(addr)

      if (!hasData) {
        noData.push(addr)
        console.log(`  ${addr}  →  NO DATA`)
        continue
      }

      const updatedAt: bigint = await registry.lastScoreUpdate(addr)
      const age = now - Number(updatedAt)
      const daysOld = (age / 86_400).toFixed(1)

      if (age > staleSeconds) {
        stale.push(addr)
        console.log(`  ${addr}  →  STALE (${daysOld} days old)`)
      } else {
        fresh.push(addr)
        console.log(`  ${addr}  →  fresh (${daysOld} days old)`)
      }
    }

    console.log('\n── Summary ──────────────────────────────────')
    console.log(`  Fresh:    ${fresh.length}`)
    console.log(`  Stale:    ${stale.length}`)
    console.log(`  No data:  ${noData.length}`)

    if (stale.length > 0) {
      console.log('\nStale borrowers need to re-run the credit submission flow:')
      console.log('  1. Encrypt signals client-side with CoFHE SDK')
      console.log('  2. Call registry.submitCreditData(...)')
      console.log('  3. Call registry.computePersonalRate()')
      console.log('  4. Call registry.setPersonalRateDirect(rateBps)')
      console.log('\nAddresses:')
      stale.forEach(a => console.log(`  ${a}`))
    }

    return { stale, fresh, noData }
  })

async function loadDeployments(networkName: string): Promise<Record<string, string>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs')
    const path = require('path')
    const file = path.join(__dirname, '..', 'deployments', `${networkName}.json`)
    if (!fs.existsSync(file)) return {}
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return {}
  }
}
