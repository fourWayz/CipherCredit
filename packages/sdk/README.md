# @ciphercredit/sdk

Privacy-preserving DeFi credit SDK powered by [Fhenix CoFHE](https://docs.fhenix.io).  
Check credit tiers, verify approvals, read loan state, and gate protocol access — without ever touching encrypted data.

```bash
npm install @ciphercredit/sdk
```

---

## Quick start (vanilla TypeScript)

```typescript
import { createPublicClient, http } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import { CipherCreditClient } from '@ciphercredit/sdk'

const publicClient = createPublicClient({
  chain:     arbitrumSepolia,
  transport: http(),
})

const sdk = new CipherCreditClient({ publicClient })

const borrower = '0xYourBorrowerAddress'
const pool     = '0xYourPoolAddress'

// Check credit tier (soul-bound NFT)
const tier = await sdk.getTier(borrower)
console.log(tier.name)        // 'Gold' | 'Silver' | 'Bronze' | 'None'
console.log(tier.multiplier)  // 2.0 (Gold), 1.5, 1.25, 1.0

// Gate access by minimum tier
const canAccessPremium = await sdk.hasMinTier(borrower, 'Silver')

// Check approval for your pool
const approved = await sdk.isApproved(borrower, pool)

// Read active loan
const loan = await sdk.getLoan(borrower)
if (loan?.isOverdue) console.log('Loan is past due — can be liquidated')

// Repayment history
const { repaymentCount, defaultCount, healthScore } = await sdk.getRepaymentStats(borrower)

// Max borrow (tier-scaled credit limit)
const limit = await sdk.getMaxBorrowable(borrower)

// Full profile in one call
const profile = await sdk.getBorrowerProfile(borrower, pool)
```

---

## React / wagmi

```tsx
import { useBorrowerProfile, useCreditTier, formatBps } from '@ciphercredit/sdk/react'

function CreditBadge({ address }: { address: `0x${string}` }) {
  const { data: tier, loading } = useCreditTier(address)

  if (loading) return <span>Loading…</span>
  if (!tier || tier.name === 'None') return <span>No credit tier</span>

  return (
    <div>
      <strong>{tier.name}</strong>
      <span>{tier.multiplier}× credit limit</span>
    </div>
  )
}

function LendingGate({ address, pool }: { address: `0x${string}`; pool: `0x${string}` }) {
  const { data: profile } = useBorrowerProfile(pool)

  if (!profile?.isApproved) return <p>Credit approval required</p>
  return <p>Approved — {formatBps(profile.personalRateBps ?? 1500)} APR</p>
}
```

---

## Signal fetching & score preview

```typescript
// Fetch on-chain signals and preview score (no CoFHE, no off-chain data)
const signals = await sdk.fetchSignals(borrower)
console.log(signals.previewScore)     // e.g. 8200 / 10000
console.log(signals.meetsThreshold)   // true if score ≥ 7000
console.log(signals.estimatedRateBps) // e.g. 1120 → 11.20% APR

// Or compute from known inputs
import { previewScore, previewRate } from '@ciphercredit/sdk'
const score = previewScore({ balance: 80, txFreq: 70, repayment: 90, debtRatio: 20 })
const rate  = previewRate({ balance: 80, txFreq: 70, repayment: 90, debtRatio: 20 })
```

---

## Protocol integration

Gate borrow access in your Solidity contract by checking the borrower's NFT tier:

```solidity
interface ICreditTierNFT {
    function getTier(address holder) external view returns (uint8);
    function hasMinted(address holder) external view returns (bool);
}

contract YourLendingProtocol {
    ICreditTierNFT constant CREDIT_NFT =
        ICreditTierNFT(0x7b5353c1c76f0fBdF40000DF272Ee81A3e9b7C9F);

    // Enum matches CreditTierNFT.Tier: 0=None 1=Bronze 2=Silver 3=Gold
    function premiumFeeTier(address borrower) external view returns (uint256 feeBps) {
        uint8 tier = CREDIT_NFT.getTier(borrower);
        if (tier == 3) return 50;   // Gold  → 0.50% fee
        if (tier == 2) return 100;  // Silver → 1.00% fee
        if (tier == 1) return 150;  // Bronze → 1.50% fee
        return 200;                  // None  → 2.00% fee
    }
}
```

Or check the pass/fail approval from `CreditScoreRegistry` directly:

```solidity
interface ICreditScoreRegistry {
    function hasApprovalFor(address borrower, address lender) external view returns (bool);
    function getRevealedApproval(address borrower, address lender) external view returns (bool);
}
```

---

## API reference

### `CipherCreditClient`

| Method | Returns | Description |
|---|---|---|
| `hasData(borrower)` | `boolean` | Credit data submitted |
| `isApproved(borrower, pool)` | `boolean` | Pool has credit approval |
| `isRateRevealed(borrower)` | `boolean` | Personal rate revealed |
| `getPersonalRate(borrower)` | `number \| null` | Rate in bps, or null |
| `getTier(borrower)` | `CreditTierInfo` | Tier name + multiplier |
| `hasMinted(borrower)` | `boolean` | Holds a CreditTierNFT |
| `hasMinTier(borrower, min)` | `boolean` | Tier gating helper |
| `getLoan(borrower)` | `LoanInfo \| null` | Active loan + isOverdue |
| `getMaxBorrowable(borrower)` | `bigint` | Tier-scaled credit limit |
| `getAccruedInterest(borrower)` | `bigint` | Interest accrued (wei) |
| `totalRepaymentDue(borrower)` | `bigint` | Full repayment amount |
| `getRepaymentStats(borrower)` | `RepaymentStats` | Count + health score |
| `getPoolStats()` | `PoolStats` | Liquidity / borrowed / deposited |
| `fetchSignals(borrower)` | `SignalResult` | On-chain signals + preview |
| `getBorrowerProfile(borrower, pool?)` | `BorrowerProfile` | All-in-one profile |
| `previewScore(inputs)` | `number` | 0–10 000 score (no RPC) |
| `previewRate(inputs)` | `number` | Rate bps (no RPC) |

### React hooks (`@ciphercredit/sdk/react`)

| Hook | Returns |
|---|---|
| `useCipherCredit()` | `CipherCreditClient \| null` |
| `useCreditTier(borrower)` | `AsyncState<CreditTierInfo>` |
| `useLoanInfo(borrower)` | `AsyncState<LoanInfo \| null>` |
| `useRepaymentStats(borrower)` | `AsyncState<RepaymentStats>` |
| `useMaxBorrowable(borrower)` | `AsyncState<bigint>` |
| `useSignals(borrower)` | `AsyncState<SignalResult>` |
| `usePoolStats()` | `AsyncState<PoolStats>` |
| `useBorrowerProfile(pool?)` | `AsyncState<BorrowerProfile>` |

All async hooks return `{ data, loading, error, refetch }`.

---

## Supported networks

| Network | Chain ID | Status |
|---|---|---|
| Arbitrum Sepolia | 421614 | Testnet |
| Base Sepolia | 84532 | Coming soon |

---

## License

MIT
