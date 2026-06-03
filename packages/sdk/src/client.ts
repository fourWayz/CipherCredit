import type { Address } from 'viem'
import { CreditScoreRegistryABI } from './abis/CreditScoreRegistry'
import { LendingPoolABI }          from './abis/LendingPool'
import { CreditTierNFTABI }        from './abis/CreditTierNFT'
import { CHAIN_CONFIGS, CREDIT_TIERS } from './constants'
import { fetchWalletSignals, previewScore, previewRate } from './utils/signals'
import type {
  ChainConfig, CipherCreditClientOptions,
  BorrowerProfile, CreditTierInfo, LoanInfo,
  PoolStats, ProviderStats, RepaymentStats, SignalInputs, SignalResult,
} from './types'

export class CipherCreditClient {
  readonly config: ChainConfig

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly pub: any // viem PublicClient — typed loosely to avoid hard dep

  constructor({ publicClient, chainId }: CipherCreditClientOptions) {
    this.pub = publicClient
    const id  = chainId ?? publicClient.chain?.id
    if (!id) throw new Error('[CipherCredit] chainId required — pass it explicitly or attach it to your PublicClient')
    const cfg = CHAIN_CONFIGS[id]
    if (!cfg) {
      const supported = Object.keys(CHAIN_CONFIGS).join(', ')
      throw new Error(`[CipherCredit] unsupported chain ${id}. Supported chain IDs: ${supported}`)
    }
    this.config = cfg
  }

  // ── Credit verification ────────────────────────────────────────────────────

  /** True if `borrower` has submitted credit data to the registry. */
  hasData(borrower: Address): Promise<boolean> {
    return this.read('registry', CreditScoreRegistryABI, 'hasData', [borrower])
  }

  /** Unix timestamp of the borrower's most recent credit data submission. */
  dataUpdatedAt(borrower: Address): Promise<bigint> {
    return this.read('registry', CreditScoreRegistryABI, 'dataUpdatedAt', [borrower])
  }

  /** True if the borrower has granted `pool` a credit approval (pass/fail only). */
  isApproved(borrower: Address, pool: Address): Promise<boolean> {
    return this.read('registry', CreditScoreRegistryABI, 'hasApprovalFor', [borrower, pool])
  }

  /** True if the borrower's personal interest rate has been revealed on-chain. */
  isRateRevealed(borrower: Address): Promise<boolean> {
    return this.read('registry', CreditScoreRegistryABI, 'isRateRevealed', [borrower])
  }

  /**
   * Returns the borrower's personal rate in basis points (e.g. 1200 = 12.00 % APR),
   * or `null` if the rate has not been revealed yet.
   */
  async getPersonalRate(borrower: Address): Promise<number | null> {
    const revealed = await this.isRateRevealed(borrower)
    if (!revealed) return null
    return Number(await this.read('registry', CreditScoreRegistryABI, 'getRevealedRate', [borrower]))
  }

  // ── Credit tier ────────────────────────────────────────────────────────────

  /** Returns the full tier info for the borrower's soul-bound CreditTierNFT. */
  async getTier(borrower: Address): Promise<CreditTierInfo> {
    const idx = Number(
      await this.read('nft', CreditTierNFTABI, 'getTier', [borrower])
    ) as 0 | 1 | 2 | 3
    return CREDIT_TIERS[idx] ?? CREDIT_TIERS[0]
  }

  /** True if the borrower holds a CreditTierNFT (any tier). */
  hasMinted(borrower: Address): Promise<boolean> {
    return this.read('nft', CreditTierNFTABI, 'hasMinted', [borrower])
  }

  /**
   * Gate access by minimum credit tier.
   * @example
   *   if (await sdk.hasMinTier(user, 'Silver')) { ... }
   */
  async hasMinTier(borrower: Address, minTier: 'Bronze' | 'Silver' | 'Gold'): Promise<boolean> {
    const TIER_ORDER = { None: 0, Bronze: 1, Silver: 2, Gold: 3 } as const
    const tier = await this.getTier(borrower)
    return TIER_ORDER[tier.name] >= TIER_ORDER[minTier]
  }

  // ── Loan state ─────────────────────────────────────────────────────────────

  /**
   * Returns the active loan for `borrower`, or `null` if none exists.
   * Includes `isOverdue` — true once `dueDate` has passed.
   */
  async getLoan(borrower: Address): Promise<LoanInfo | null> {
    const raw = await this.read('pool', LendingPoolABI, 'loans', [borrower]) as readonly unknown[]
    if (!raw[3]) return null  // active == false
    const dueDate = new Date(Number(raw[6]) * 1000)
    return {
      principal:       raw[0] as bigint,
      collateral:      raw[1] as bigint,
      creditApproved:  raw[2] as boolean,
      issuedAt:        new Date(Number(raw[4]) * 1000),
      interestRateBps: Number(raw[5]),
      dueDate,
      isOverdue: Date.now() > dueDate.getTime(),
    }
  }

  /**
   * Maximum ETH the borrower may borrow right now.
   * Scales with their NFT tier: Gold 2×, Silver 1.5×, Bronze 1.25× the base limit.
   */
  getMaxBorrowable(borrower: Address): Promise<bigint> {
    return this.read('pool', LendingPoolABI, 'maxBorrowable', [borrower])
  }

  /** Accrued interest on an active loan (wei). */
  getAccruedInterest(borrower: Address): Promise<bigint> {
    return this.read('pool', LendingPoolABI, 'getAccruedInterest', [borrower])
  }

  /** Total repayment amount due right now (principal + interest, in wei). */
  totalRepaymentDue(borrower: Address): Promise<bigint> {
    return this.read('pool', LendingPoolABI, 'totalRepaymentDue', [borrower])
  }

  // ── Repayment history ──────────────────────────────────────────────────────

  /**
   * On-chain repayment and default counters for `borrower`.
   * `healthScore` (0–100) is derived from the ratio of repayments to defaults.
   */
  async getRepaymentStats(borrower: Address): Promise<RepaymentStats> {
    const [repaymentCount, defaultCount] = await Promise.all([
      this.read('pool', LendingPoolABI, 'repaymentCount', [borrower]),
      this.read('pool', LendingPoolABI, 'defaultCount',   [borrower]),
    ])
    const rc = Number(repaymentCount)
    const dc = Number(defaultCount)
    return { repaymentCount: rc, defaultCount: dc, healthScore: healthScore(rc, dc) }
  }

  // ── Pool stats ─────────────────────────────────────────────────────────────

  async getPoolStats(): Promise<PoolStats> {
    const [liquidity, totalBorrowed, totalLPBalance, utilisationBps] = await Promise.all([
      this.read('pool', LendingPoolABI, 'availableLiquidity', []),
      this.read('pool', LendingPoolABI, 'totalBorrowed',      []),
      this.read('pool', LendingPoolABI, 'totalLPBalance',     []),
      this.read('pool', LendingPoolABI, 'lpUtilisation',      []),
    ])
    return { liquidity, totalBorrowed, totalLPBalance, utilisationBps: Number(utilisationBps) }
  }

  /**
   * Current ETH balance and share count for a liquidity provider.
   * `balance` includes accrued yield — it will exceed the original deposit once interest accrues.
   */
  async getProviderStats(provider: Address): Promise<ProviderStats> {
    const [balance, shares] = await Promise.all([
      this.read('pool', LendingPoolABI, 'providerBalance', [provider]),
      this.read('pool', LendingPoolABI, 'providerShares', [provider]),
    ])
    return { balance, shares }
  }

  /**
   * One-call composability check for external protocols.
   * Returns true iff the borrower's credit tier meets `minTier` and their data
   * is no older than `maxAgeDays` (pass 0 for no freshness check).
   * @param minTier  1=Bronze, 2=Silver, 3=Gold
   */
  verifyCreditTier(borrower: Address, minTier: 1 | 2 | 3, maxAgeDays = 0): Promise<boolean> {
    const maxAge = maxAgeDays * 86_400
    return this.read('registry', CreditScoreRegistryABI, 'verifyCreditTier', [borrower, minTier, maxAge])
  }

  /** Unix timestamp of the borrower's most recent credit data submission (alias for dataUpdatedAt). */
  lastScoreUpdate(borrower: Address): Promise<bigint> {
    return this.read('registry', CreditScoreRegistryABI, 'lastScoreUpdate', [borrower])
  }

  // ── Signals & score preview ────────────────────────────────────────────────

  /**
   * Fetch normalised credit signals from the chain for `borrower`.
   * Returns raw wallet metrics alongside the FHE score preview and estimated rate.
   * No CoFHE dependency — pure on-chain reads.
   */
  fetchSignals(borrower: Address): Promise<SignalResult> {
    return fetchWalletSignals(this.pub, this.config, borrower)
  }

  /** Preview credit score from normalised inputs (0–10 000). No RPC call. */
  previewScore(inputs: SignalInputs): number { return previewScore(inputs) }

  /** Preview interest rate (bps) from normalised inputs. No RPC call. */
  previewRate(inputs: SignalInputs): number { return previewRate(inputs) }

  // ── Full borrower profile ──────────────────────────────────────────────────

  /**
   * Single call that aggregates all on-chain data for a borrower.
   * Pass `pool` to also check approval status for that pool.
   */
  async getBorrowerProfile(borrower: Address, pool?: Address): Promise<BorrowerProfile> {
    const [tier, stats, loan, maxBorrowable, rate, data] = await Promise.all([
      this.getTier(borrower),
      this.getRepaymentStats(borrower),
      this.getLoan(borrower),
      this.getMaxBorrowable(borrower),
      this.getPersonalRate(borrower),
      this.hasData(borrower),
    ])

    const profile: BorrowerProfile = {
      address: borrower,
      tier,
      repaymentStats:  stats,
      activeLoan:      loan,
      maxBorrowable,
      personalRateBps: rate,
      hasData:         data,
    }

    if (pool) {
      profile.isApproved = await this.isApproved(borrower, pool)
    }

    return profile
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private read(contract: 'registry' | 'pool' | 'nft', abi: any, functionName: string, args: unknown[]): Promise<any> {
    return this.pub.readContract({
      address: this.config[contract],
      abi,
      functionName,
      args,
    })
  }
}

function healthScore(repayments: number, defaults: number): number {
  if (repayments === 0 && defaults === 0) return 50
  const bonus  = Math.min(repayments * 10, 70)
  const penalty = Math.min(defaults   * 20, 60)
  return Math.max(0, Math.min(100, 50 + bonus - penalty))
}
