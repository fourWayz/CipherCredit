import { Address, PublicClient } from 'viem';

type TierIndex = 0 | 1 | 2 | 3;
interface CreditTierInfo {
    index: TierIndex;
    name: 'None' | 'Bronze' | 'Silver' | 'Gold';
    multiplier: number;
    rateCeilBps: number;
}
interface LoanInfo {
    principal: bigint;
    collateral: bigint;
    creditApproved: boolean;
    issuedAt: Date;
    interestRateBps: number;
    dueDate: Date;
    isOverdue: boolean;
}
interface RepaymentStats {
    repaymentCount: number;
    defaultCount: number;
    /** 0–100 composite health score derived from on-chain repayment and default history */
    healthScore: number;
}
interface SignalInputs {
    balance: number;
    txFreq: number;
    repayment: number;
    debtRatio: number;
}
interface SignalResult extends SignalInputs {
    balanceEth: number;
    txCount: number;
    repayments: number;
    defaults: number;
    hasActiveLoan: boolean;
    previewScore: number;
    meetsThreshold: boolean;
    estimatedRateBps: number;
}
interface PoolStats {
    liquidity: bigint;
    totalBorrowed: bigint;
    totalLPBalance: bigint;
    utilisationBps: number;
}
interface ProviderStats {
    balance: bigint;
    shares: bigint;
}
interface ChainConfig {
    chainId: number;
    name: string;
    registry: Address;
    pool: Address;
    nft: Address;
}
interface BorrowerProfile {
    address: Address;
    tier: CreditTierInfo;
    repaymentStats: RepaymentStats;
    activeLoan: LoanInfo | null;
    maxBorrowable: bigint;
    personalRateBps: number | null;
    hasData: boolean;
    isApproved?: boolean;
}
interface CipherCreditClientOptions {
    publicClient: PublicClient;
    chainId?: number;
}

declare class CipherCreditClient {
    readonly config: ChainConfig;
    private readonly pub;
    constructor({ publicClient, chainId }: CipherCreditClientOptions);
    /** True if `borrower` has submitted credit data to the registry. */
    hasData(borrower: Address): Promise<boolean>;
    /** Unix timestamp of the borrower's most recent credit data submission. */
    dataUpdatedAt(borrower: Address): Promise<bigint>;
    /** True if the borrower has granted `pool` a credit approval (pass/fail only). */
    isApproved(borrower: Address, pool: Address): Promise<boolean>;
    /** True if the borrower's personal interest rate has been revealed on-chain. */
    isRateRevealed(borrower: Address): Promise<boolean>;
    /**
     * Returns the borrower's personal rate in basis points (e.g. 1200 = 12.00 % APR),
     * or `null` if the rate has not been revealed yet.
     */
    getPersonalRate(borrower: Address): Promise<number | null>;
    /** Returns the full tier info for the borrower's soul-bound CreditTierNFT. */
    getTier(borrower: Address): Promise<CreditTierInfo>;
    /** True if the borrower holds a CreditTierNFT (any tier). */
    hasMinted(borrower: Address): Promise<boolean>;
    /**
     * Gate access by minimum credit tier.
     * @example
     *   if (await sdk.hasMinTier(user, 'Silver')) { ... }
     */
    hasMinTier(borrower: Address, minTier: 'Bronze' | 'Silver' | 'Gold'): Promise<boolean>;
    /**
     * Returns the active loan for `borrower`, or `null` if none exists.
     * Includes `isOverdue` — true once `dueDate` has passed.
     */
    getLoan(borrower: Address): Promise<LoanInfo | null>;
    /**
     * Maximum ETH the borrower may borrow right now.
     * Scales with their NFT tier: Gold 2×, Silver 1.5×, Bronze 1.25× the base limit.
     */
    getMaxBorrowable(borrower: Address): Promise<bigint>;
    /** Accrued interest on an active loan (wei). */
    getAccruedInterest(borrower: Address): Promise<bigint>;
    /** Total repayment amount due right now (principal + interest, in wei). */
    totalRepaymentDue(borrower: Address): Promise<bigint>;
    /**
     * On-chain repayment and default counters for `borrower`.
     * `healthScore` (0–100) is derived from the ratio of repayments to defaults.
     */
    getRepaymentStats(borrower: Address): Promise<RepaymentStats>;
    getPoolStats(): Promise<PoolStats>;
    /**
     * Current ETH balance and share count for a liquidity provider.
     * `balance` includes accrued yield — it will exceed the original deposit once interest accrues.
     */
    getProviderStats(provider: Address): Promise<ProviderStats>;
    /**
     * One-call composability check for external protocols.
     * Returns true iff the borrower's credit tier meets `minTier` and their data
     * is no older than `maxAgeDays` (pass 0 for no freshness check).
     * @param minTier  1=Bronze, 2=Silver, 3=Gold
     */
    verifyCreditTier(borrower: Address, minTier: 1 | 2 | 3, maxAgeDays?: number): Promise<boolean>;
    /** Unix timestamp of the borrower's most recent credit data submission (alias for dataUpdatedAt). */
    lastScoreUpdate(borrower: Address): Promise<bigint>;
    /**
     * Fetch normalised credit signals from the chain for `borrower`.
     * Returns raw wallet metrics alongside the FHE score preview and estimated rate.
     * No CoFHE dependency — pure on-chain reads.
     */
    fetchSignals(borrower: Address): Promise<SignalResult>;
    /** Preview credit score from normalised inputs (0–10 000). No RPC call. */
    previewScore(inputs: SignalInputs): number;
    /** Preview interest rate (bps) from normalised inputs. No RPC call. */
    previewRate(inputs: SignalInputs): number;
    /**
     * Single call that aggregates all on-chain data for a borrower.
     * Pass `pool` to also check approval status for that pool.
     */
    getBorrowerProfile(borrower: Address, pool?: Address): Promise<BorrowerProfile>;
    private read;
}

declare const ARB_SEPOLIA_CHAIN_ID = 421614;
declare const BASE_SEPOLIA_CHAIN_ID = 84532;
declare const CHAIN_CONFIGS: Record<number, ChainConfig>;
declare const CREDIT_TIERS: Record<TierIndex, CreditTierInfo>;
declare const MIN_CREDIT_THRESHOLD = 7000;
declare const BASE_RATE_BPS = 1500;
declare const MIN_RATE_BPS = 800;
declare const MAX_SCORE = 10000;
declare const W_BALANCE = 25;
declare const W_TX_FREQ = 20;
declare const W_REPAYMENT = 40;
declare const W_DEBT = 15;

/**
 * Compute the FHE credit score from normalised inputs.
 * Matches the on-chain formula in CreditScoreRegistry.sol exactly:
 *   score = balance×25 + txFreq×20 + repayment×40 + (100−debtRatio)×15
 */
declare function previewScore(inputs: SignalInputs): number;
/**
 * Estimate the personal interest rate (bps) for given inputs.
 * Mirrors the rate formula in CreditScoreRegistry.sol:
 *   rateBps = (45000 − (score − 7000) × 7) / 30
 * Returns BASE_RATE_BPS (1500) if score is below MIN_CREDIT_THRESHOLD.
 */
declare function previewRate(inputs: SignalInputs): number;
/**
 * Fetch and normalise on-chain credit signals for `borrower`.
 * Reads balance, nonce, repaymentCount, defaultCount, and active loan status
 * from the chain — no off-chain data sources, no CoFHE dependency.
 */
declare function fetchWalletSignals(publicClient: any, config: ChainConfig, borrower: Address): Promise<SignalResult>;

/**
 * Format basis points as a human-readable percentage string.
 * @example formatBps(1500) → "15.00%"
 */
declare function formatBps(bps: number): string;
/**
 * Convert basis points to APR percentage number.
 * @example bpsToApr(1200) → 12.0
 */
declare function bpsToApr(bps: number): number;
/**
 * Format a wei bigint as a compact ETH string, trimming trailing zeros.
 * @example formatEthShort(1500000000000000n) → "0.0015 ETH"
 */
declare function formatEthShort(wei: bigint, decimals?: number): string;
/**
 * Format a tier credit-limit multiplier as a readable string.
 * @example formatTierMultiplier(1.5) → "1.5×"
 */
declare function formatTierMultiplier(multiplier: number): string;
/**
 * Returns a human-readable countdown string for a loan due date.
 * @example formatTimeLeft(dueDate) → "12d 4h left" | "OVERDUE"
 */
declare function formatTimeLeft(dueDate: Date): string;

export { ARB_SEPOLIA_CHAIN_ID as A, BASE_RATE_BPS as B, CHAIN_CONFIGS as C, type LoanInfo as L, MAX_SCORE as M, type PoolStats as P, type RepaymentStats as R, type SignalInputs as S, type TierIndex as T, W_BALANCE as W, BASE_SEPOLIA_CHAIN_ID as a, type BorrowerProfile as b, CREDIT_TIERS as c, type ChainConfig as d, CipherCreditClient as e, type CipherCreditClientOptions as f, type CreditTierInfo as g, MIN_CREDIT_THRESHOLD as h, MIN_RATE_BPS as i, type SignalResult as j, W_DEBT as k, W_REPAYMENT as l, W_TX_FREQ as m, bpsToApr as n, fetchWalletSignals as o, formatBps as p, formatEthShort as q, formatTierMultiplier as r, formatTimeLeft as s, previewRate as t, previewScore as u };
