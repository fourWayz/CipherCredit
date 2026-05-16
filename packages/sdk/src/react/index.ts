'use client'

import { useMemo, useEffect, useState } from 'react'
import { usePublicClient, useChainId, useAccount } from 'wagmi'
import type { Address } from 'viem'
import { CipherCreditClient } from '../client'
import type {
  BorrowerProfile, CreditTierInfo, LoanInfo,
  PoolStats, RepaymentStats, SignalResult,
} from '../types'

//  SDK instance hook ─

/**
 * Returns a `CipherCreditClient` scoped to the connected wallet's chain,
 * or `null` when no wagmi public client is available.
 *
 * @example
 *   const sdk = useCipherCredit()
 *   const tier = await sdk?.getTier(address)
 */
export function useCipherCredit(): CipherCreditClient | null {
  const publicClient = usePublicClient()
  const chainId      = useChainId()
  return useMemo(() => {
    if (!publicClient) return null
    try { return new CipherCreditClient({ publicClient, chainId }) }
    catch { return null }
  }, [publicClient, chainId])
}

//  Generic async data hook ─

type AsyncState<T> = { data: T | undefined; loading: boolean; error: string | null; refetch: () => void }

function useAsync<T>(factory: (() => Promise<T>) | null | undefined): AsyncState<T> {
  const [data,    setData]    = useState<T | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [rev,     setRev]     = useState(0)

  useEffect(() => {
    if (!factory) { setData(undefined); return }
    let cancelled = false
    setLoading(true)
    setError(null)
    factory()
      .then(v  => { if (!cancelled) { setData(v);       setLoading(false) } })
      .catch(e => { if (!cancelled) { setError(String(e)); setLoading(false) } })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory, rev])

  const refetch = () => setRev(r => r + 1)
  return { data, loading, error, refetch }
}

//  Domain hooks 

/**
 * Credit tier info for a borrower — None / Bronze / Silver / Gold.
 *
 * @example
 *   const { data: tier } = useCreditTier(address)
 *   if (tier?.name === 'Gold') { ... }
 */
export function useCreditTier(borrower: Address | undefined): AsyncState<CreditTierInfo> {
  const sdk = useCipherCredit()
  const fn  = useMemo(
    () => borrower && sdk ? () => sdk.getTier(borrower) : null,
    [sdk, borrower],
  )
  return useAsync(fn)
}

/**
 * Active loan details including `isOverdue`.
 * Returns `null` data when the borrower has no active loan.
 */
export function useLoanInfo(borrower: Address | undefined): AsyncState<LoanInfo | null> {
  const sdk = useCipherCredit()
  const fn  = useMemo(
    () => borrower && sdk ? () => sdk.getLoan(borrower) : null,
    [sdk, borrower],
  )
  return useAsync(fn)
}

/**
 * On-chain repayment and default counters plus a composite health score (0–100).
 */
export function useRepaymentStats(borrower: Address | undefined): AsyncState<RepaymentStats> {
  const sdk = useCipherCredit()
  const fn  = useMemo(
    () => borrower && sdk ? () => sdk.getRepaymentStats(borrower) : null,
    [sdk, borrower],
  )
  return useAsync(fn)
}

/**
 * Maximum ETH the borrower may request. Accounts for NFT tier multiplier.
 */
export function useMaxBorrowable(borrower: Address | undefined): AsyncState<bigint> {
  const sdk = useCipherCredit()
  const fn  = useMemo(
    () => borrower && sdk ? () => sdk.getMaxBorrowable(borrower) : null,
    [sdk, borrower],
  )
  return useAsync(fn)
}

/**
 * Fetches and normalises on-chain credit signals for a borrower.
 * Includes score preview and whether the borrower meets the credit threshold.
 */
export function useSignals(borrower: Address | undefined): AsyncState<SignalResult> {
  const sdk = useCipherCredit()
  const fn  = useMemo(
    () => borrower && sdk ? () => sdk.fetchSignals(borrower) : null,
    [sdk, borrower],
  )
  return useAsync(fn)
}

/**
 * Lending pool statistics: available liquidity, total borrowed, total deposited.
 */
export function usePoolStats(): AsyncState<PoolStats> {
  const sdk = useCipherCredit()
  const fn  = useMemo(() => sdk ? () => sdk.getPoolStats() : null, [sdk])
  return useAsync(fn)
}

/**
 * Full borrower profile in a single hook — tier, loan, repayment stats,
 * credit limit, personal rate, and optional approval status for a given pool.
 *
 * @example
 *   const { data } = useBorrowerProfile(POOL_ADDRESS)
 *   console.log(data?.tier.name, data?.maxBorrowable)
 */
export function useBorrowerProfile(pool?: Address): AsyncState<BorrowerProfile> {
  const { address } = useAccount()
  const sdk = useCipherCredit()
  const fn  = useMemo(
    () => address && sdk ? () => sdk.getBorrowerProfile(address, pool) : null,
    [sdk, address, pool],
  )
  return useAsync(fn)
}

//  Re-exports for convenience 

export { CipherCreditClient } from '../client'
export { previewScore, previewRate } from '../utils/signals'
export { formatBps, formatEthShort, formatTierMultiplier, formatTimeLeft } from '../utils/format'
export { CREDIT_TIERS, MIN_CREDIT_THRESHOLD, BASE_RATE_BPS } from '../constants'
export type { BorrowerProfile, CreditTierInfo, LoanInfo, PoolStats, RepaymentStats, SignalResult }
