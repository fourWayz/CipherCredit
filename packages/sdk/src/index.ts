export { CipherCreditClient }  from './client'

export type {
  ChainConfig,
  CipherCreditClientOptions,
  BorrowerProfile,
  CreditTierInfo,
  LoanInfo,
  PoolStats,
  RepaymentStats,
  SignalInputs,
  SignalResult,
  TierIndex,
} from './types'

export {
  CHAIN_CONFIGS,
  CREDIT_TIERS,
  ARB_SEPOLIA_CHAIN_ID,
  BASE_SEPOLIA_CHAIN_ID,
  MIN_CREDIT_THRESHOLD,
  BASE_RATE_BPS,
  MIN_RATE_BPS,
  MAX_SCORE,
  W_BALANCE,
  W_TX_FREQ,
  W_REPAYMENT,
  W_DEBT,
} from './constants'

export { previewScore, previewRate, fetchWalletSignals } from './utils/signals'
export { formatBps, formatEthShort, formatTierMultiplier, bpsToApr } from './utils/format'

// Contract ABIs — useful for direct viem / ethers integration
export { CreditScoreRegistryABI } from './abis/CreditScoreRegistry'
export { LendingPoolABI }          from './abis/LendingPool'
export { CreditTierNFTABI }        from './abis/CreditTierNFT'
