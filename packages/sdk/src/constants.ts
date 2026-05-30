import type { ChainConfig, CreditTierInfo, TierIndex } from './types'

export const ARB_SEPOLIA_CHAIN_ID  = 421614
export const BASE_SEPOLIA_CHAIN_ID = 84532

// ── Deployed contract addresses ───────────────────────────────────────────────

export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  [ARB_SEPOLIA_CHAIN_ID]: {
    chainId:  ARB_SEPOLIA_CHAIN_ID,
    name:     'Arbitrum Sepolia',
    registry: '0xb05dB39DF30485aF300874A7fF3BEfDA72F15Ab0',
    pool:     '0x76b09CC00c892c76C18948e9f2ca1Aa43C93321e',
    nft:      '0x2522743838D43e6EB9532f1EEE452B85F4aAF89E',
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
