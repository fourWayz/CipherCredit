import { arbitrumSepolia, baseSepolia } from 'wagmi/chains'

type Addresses = { registry: `0x${string}`; pool: `0x${string}`; nft: `0x${string}` }

export const CONTRACT_ADDRESSES: Record<number, Addresses> = {
  // Arbitrum Sepolia (chainId 421614)
  [arbitrumSepolia.id]: {
    registry: '0xb05dB39DF30485aF300874A7fF3BEfDA72F15Ab0',
    pool:     '0x76b09CC00c892c76C18948e9f2ca1Aa43C93321e',
    nft:      '0x2522743838D43e6EB9532f1EEE452B85F4aAF89E',
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
