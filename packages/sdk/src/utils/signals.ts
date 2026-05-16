import { formatEther } from 'viem'
import type { Address } from 'viem'
import { LendingPoolABI } from '../abis/LendingPool'
import type { ChainConfig, SignalInputs, SignalResult } from '../types'
import {
  MIN_CREDIT_THRESHOLD, BASE_RATE_BPS, MIN_RATE_BPS,
  W_BALANCE, W_TX_FREQ, W_REPAYMENT, W_DEBT,
} from '../constants'

// Reference ceilings for normalisation — tuned for Arbitrum Sepolia testnet
const BALANCE_CEIL_ETH = 5    // 5 ETH  → score 100
const TX_COUNT_CEIL    = 200  // 200 tx  → score 100
const REPAY_CEIL       = 5    // 5 repayments → score 100

function clamp(v: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, v))
}

/**
 * Compute the FHE credit score from normalised inputs.
 * Matches the on-chain formula in CreditScoreRegistry.sol exactly:
 *   score = balance×25 + txFreq×20 + repayment×40 + (100−debtRatio)×15
 */
export function previewScore(inputs: SignalInputs): number {
  return (
    inputs.balance   * W_BALANCE +
    inputs.txFreq    * W_TX_FREQ +
    inputs.repayment * W_REPAYMENT +
    (100 - inputs.debtRatio) * W_DEBT
  )
}

/**
 * Estimate the personal interest rate (bps) for given inputs.
 * Mirrors the rate formula in CreditScoreRegistry.sol:
 *   rateBps = (45000 − (score − 7000) × 7) / 30
 * Returns BASE_RATE_BPS (1500) if score is below MIN_CREDIT_THRESHOLD.
 */
export function previewRate(inputs: SignalInputs): number {
  const score = previewScore(inputs)
  if (score < MIN_CREDIT_THRESHOLD) return BASE_RATE_BPS
  const raw = Math.round((45_000 - (score - MIN_CREDIT_THRESHOLD) * 7) / 30)
  return Math.max(MIN_RATE_BPS, Math.min(BASE_RATE_BPS - 1, raw))
}

/**
 * Fetch and normalise on-chain credit signals for `borrower`.
 * Reads balance, nonce, repaymentCount, defaultCount, and active loan status
 * from the chain — no off-chain data sources, no CoFHE dependency.
 */
export async function fetchWalletSignals(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  publicClient: any,
  config: ChainConfig,
  borrower: Address,
): Promise<SignalResult> {
  const [balance, txCount, loanRaw, repayCountRaw, defaultCountRaw] = await Promise.all([
    publicClient.getBalance({ address: borrower }),
    publicClient.getTransactionCount({ address: borrower }),

    publicClient.readContract({
      address: config.pool,
      abi:     LendingPoolABI,
      functionName: 'loans',
      args:    [borrower],
    }).catch(() => null),

    publicClient.readContract({
      address: config.pool,
      abi:     LendingPoolABI,
      functionName: 'repaymentCount',
      args:    [borrower],
    }).catch(() => 0n),

    publicClient.readContract({
      address: config.pool,
      abi:     LendingPoolABI,
      functionName: 'defaultCount',
      args:    [borrower],
    }).catch(() => 0n),
  ])

  const balanceEth    = parseFloat(formatEther(balance as bigint))
  const repayments    = Number(repayCountRaw  as bigint)
  const defaults      = Number(defaultCountRaw as bigint)
  const hasActiveLoan = loanRaw ? !!(loanRaw as readonly unknown[])[3] : false

  const balanceScore = clamp(Math.round(balanceEth  / BALANCE_CEIL_ETH * 100))
  const txScore      = clamp(Math.round(txCount     / TX_COUNT_CEIL    * 100))
  const repayScore   = clamp(Math.round(repayments  / REPAY_CEIL       * 100))

  // Each default adds up to 30 pts of debt pressure; active loan raises baseline
  const debtPenalty = Math.min(defaults * 10, 30)
  const debtRatio   = hasActiveLoan
    ? clamp(50 + Math.round((1 - balanceEth / BALANCE_CEIL_ETH) * 30) + debtPenalty)
    : clamp(Math.round(Math.max(0, 20 - balanceScore / 10)) + debtPenalty)

  const inputs: SignalInputs = {
    balance: balanceScore,
    txFreq:  txScore,
    repayment: repayScore,
    debtRatio,
  }

  const score = previewScore(inputs)
  return {
    ...inputs,
    balanceEth,
    txCount,
    repayments,
    defaults,
    hasActiveLoan,
    previewScore:     score,
    meetsThreshold:   score >= MIN_CREDIT_THRESHOLD,
    estimatedRateBps: previewRate(inputs),
  }
}
