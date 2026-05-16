import type { PublicClient, Address } from 'viem'

export type TierIndex = 0 | 1 | 2 | 3

export interface CreditTierInfo {
  index:       TierIndex
  name:        'None' | 'Bronze' | 'Silver' | 'Gold'
  multiplier:  number   // credit-limit multiplier relative to base (1, 1.25, 1.5, 2.0)
  rateCeilBps: number   // max APR basis points for this tier (0 = not credit-approved)
}

export interface LoanInfo {
  principal:       bigint
  collateral:      bigint
  creditApproved:  boolean
  issuedAt:        Date
  interestRateBps: number
  dueDate:         Date
  isOverdue:       boolean
}

export interface RepaymentStats {
  repaymentCount: number
  defaultCount:   number
  /** 0–100 composite health score derived from on-chain repayment and default history */
  healthScore:    number
}

export interface SignalInputs {
  balance:   number   // 0–100 normalised wallet balance score
  txFreq:    number   // 0–100 normalised transaction frequency
  repayment: number   // 0–100 normalised repayment history
  debtRatio: number   // 0–100 normalised debt ratio (lower is healthier)
}

export interface SignalResult extends SignalInputs {
  balanceEth:       number
  txCount:          number
  repayments:       number
  defaults:         number
  hasActiveLoan:    boolean
  previewScore:     number
  meetsThreshold:   boolean
  estimatedRateBps: number
}

export interface PoolStats {
  liquidity:      bigint
  totalBorrowed:  bigint
  totalDeposited: bigint
}

export interface ChainConfig {
  chainId:  number
  name:     string
  registry: Address
  pool:     Address
  nft:      Address
}

export interface BorrowerProfile {
  address:         Address
  tier:            CreditTierInfo
  repaymentStats:  RepaymentStats
  activeLoan:      LoanInfo | null
  maxBorrowable:   bigint
  personalRateBps: number | null
  hasData:         boolean
  isApproved?:     boolean
}

export interface CipherCreditClientOptions {
  publicClient: PublicClient
  chainId?:     number
}
