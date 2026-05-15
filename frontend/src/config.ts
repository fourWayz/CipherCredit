import { arbitrumSepolia, baseSepolia } from 'wagmi/chains'

type Addresses = { registry: `0x${string}`; pool: `0x${string}`; nft: `0x${string}` }

export const CONTRACT_ADDRESSES: Record<number, Addresses> = {
  // Arbitrum Sepolia (chainId 421614)
  [arbitrumSepolia.id]: {
    registry: '0x5251f7e0890d02001cFeD2191924922D285579F1',
    pool:     '0xD49e2362B08a65C5B8eB77bEdD153E60D8Bceda8',
    nft:      '0x02ABEC33b433f8370b24b55f4caA6412E3D4E0B3',
  },
  // Base Sepolia (chainId 84532)
  [baseSepolia.id]: {
    registry: '0x0000000000000000000000000000000000000000',
    pool:     '0x0000000000000000000000000000000000000000',
    nft:      '0x0000000000000000000000000000000000000000',
  },
}

export const SUPPORTED_CHAINS = [arbitrumSepolia, baseSepolia] as const

export const MIN_CREDIT_THRESHOLD = 7_000
export const BASE_RATE_BPS        = 1_500   // 15.00%
export const MIN_RATE_BPS         =   800   // 8.00%
