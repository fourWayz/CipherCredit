import { Address } from 'viem';
import { b as BorrowerProfile, e as CipherCreditClient, g as CreditTierInfo, L as LoanInfo, P as PoolStats, R as RepaymentStats, j as SignalResult } from '../format-BnAAUSW9.js';
export { B as BASE_RATE_BPS, c as CREDIT_TIERS, h as MIN_CREDIT_THRESHOLD, p as formatBps, q as formatEthShort, r as formatTierMultiplier, s as formatTimeLeft, t as previewRate, u as previewScore } from '../format-BnAAUSW9.js';

/**
 * Returns a `CipherCreditClient` scoped to the connected wallet's chain,
 * or `null` when no wagmi public client is available.
 *
 * @example
 *   const sdk = useCipherCredit()
 *   const tier = await sdk?.getTier(address)
 */
declare function useCipherCredit(): CipherCreditClient | null;
type AsyncState<T> = {
    data: T | undefined;
    loading: boolean;
    error: string | null;
    refetch: () => void;
};
/**
 * Credit tier info for a borrower — None / Bronze / Silver / Gold.
 *
 * @example
 *   const { data: tier } = useCreditTier(address)
 *   if (tier?.name === 'Gold') { ... }
 */
declare function useCreditTier(borrower: Address | undefined): AsyncState<CreditTierInfo>;
/**
 * Active loan details including `isOverdue`.
 * Returns `null` data when the borrower has no active loan.
 */
declare function useLoanInfo(borrower: Address | undefined): AsyncState<LoanInfo | null>;
/**
 * On-chain repayment and default counters plus a composite health score (0–100).
 */
declare function useRepaymentStats(borrower: Address | undefined): AsyncState<RepaymentStats>;
/**
 * Maximum ETH the borrower may request. Accounts for NFT tier multiplier.
 */
declare function useMaxBorrowable(borrower: Address | undefined): AsyncState<bigint>;
/**
 * Fetches and normalises on-chain credit signals for a borrower.
 * Includes score preview and whether the borrower meets the credit threshold.
 */
declare function useSignals(borrower: Address | undefined): AsyncState<SignalResult>;
/**
 * Lending pool statistics: available liquidity, total borrowed, total deposited.
 */
declare function usePoolStats(): AsyncState<PoolStats>;
/**
 * Full borrower profile in a single hook — tier, loan, repayment stats,
 * credit limit, personal rate, and optional approval status for a given pool.
 *
 * @example
 *   const { data } = useBorrowerProfile(POOL_ADDRESS)
 *   console.log(data?.tier.name, data?.maxBorrowable)
 */
declare function useBorrowerProfile(pool?: Address): AsyncState<BorrowerProfile>;

export { BorrowerProfile, CipherCreditClient, CreditTierInfo, LoanInfo, PoolStats, RepaymentStats, SignalResult, useBorrowerProfile, useCipherCredit, useCreditTier, useLoanInfo, useMaxBorrowable, usePoolStats, useRepaymentStats, useSignals };
