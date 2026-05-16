import type { ChainConfig, CreditTierInfo, TierIndex } from './types'

export const ARB_SEPOLIA_CHAIN_ID  = 421614
export const BASE_SEPOLIA_CHAIN_ID = 84532

// ── Deployed contract addresses ───────────────────────────────────────────────

export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  [ARB_SEPOLIA_CHAIN_ID]: {
    chainId:  ARB_SEPOLIA_CHAIN_ID,
    name:     'Arbitrum Sepolia',
    registry: '0x5251f7e0890d02001cFeD2191924922D285579F1',
    pool:     '0xD49e2362B08a65C5B8eB77bEdD153E60D8Bceda8',
    nft:      '0x02ABEC33b433f8370b24b55f4caA6412E3D4E0B3',
  },
}

// ── Credit tier metadata ──────────────────────────────────────────────────────
// Tier thresholds mirror CreditTierNFT.sol constants:
//   Gold   — rate ≤ 1033 bps (10.33 % APR, score ≥ ~9 000)
//   Silver — rate ≤ 1383 bps (13.83 % APR, score ≥ ~7 500)
//   Bronze — rate <  1500 bps (any credit-approved borrower, score ≥  7 000)

export const CREDIT_TIERS: Record<TierIndex, CreditTierInfo> = {
  0: { index: 0, name: 'None',   multiplier: 1.00, rateCeilBps: 0    },
  1: { index: 1, name: 'Bronze', multiplier: 1.25, rateCeilBps: 1499 },
  2: { index: 2, name: 'Silver', multiplier: 1.50, rateCeilBps: 1383 },
  3: { index: 3, name: 'Gold',   multiplier: 2.00, rateCeilBps: 1033 },
}

// ── Protocol constants (mirror CreditScoreRegistry.sol) ──────────────────────

export const MIN_CREDIT_THRESHOLD = 7_000   // minimum score for credit approval
export const BASE_RATE_BPS        = 1_500   // 15.00 % — standard APR (no credit)
export const MIN_RATE_BPS         =   800   // 8.00  % — best possible APR (Gold)
export const MAX_SCORE            = 10_000  // perfect FHE credit score

// Score weights — must stay in sync with CreditScoreRegistry.sol
export const W_BALANCE   = 25
export const W_TX_FREQ   = 20
export const W_REPAYMENT = 40
export const W_DEBT      = 15
