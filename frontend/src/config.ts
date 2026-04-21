import { arbitrumSepolia, baseSepolia } from 'wagmi/chains'

// ── Contract addresses (replace after running `pnpm deploy-credit`) ──────────
export const CONTRACT_ADDRESSES: Record<number, { registry: `0x${string}`; pool: `0x${string}` }> = {
  // Arbitrum Sepolia (chainId 421614)
  [arbitrumSepolia.id]: {
    registry: '0xfbf61a33ab9eA16D7191d68298D0298B6e62b61c',
    pool:     '0xAc5Ee2Aff86732530Ee83B7448bcDAd82811aCF0',
  },
  // Base Sepolia (chainId 84532)
  [baseSepolia.id]: {
    registry: '0x0000000000000000000000000000000000000000',
    pool:     '0x0000000000000000000000000000000000000000',
  },
}

export const SUPPORTED_CHAINS = [arbitrumSepolia, baseSepolia] as const

// Minimum credit score required for reduced collateral (70% of max 10 000)
export const MIN_CREDIT_THRESHOLD = 7_000
