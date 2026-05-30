# CipherCredit — FHE-Powered On-Chain Credit Protocol

> Privacy-preserving DeFi credit scoring built on [Fhenix CoFHE](https://docs.fhenix.io).  
> Lenders see only **pass or fail** — never your balances, history, or numeric score.

**[Live Demo →](https://cipher-credit.vercel.app/)**

---

## The Problem

Every DeFi lending protocol today demands 150 %+ collateral because there is no privacy-safe way to assess creditworthiness on-chain. Exposing raw financial data to compute a score would destroy the privacy guarantees that make self-custody valuable.

## The Solution

CipherCredit computes a weighted credit score **entirely on encrypted data** using Fully Homomorphic Encryption (FHE). The score never exists in plaintext on-chain. Lenders receive a single encrypted boolean — approved or denied — and nothing else.

```text
score = balance×25 + txFrequency×20 + repaymentHistory×40 + (100−debtRatio)×15
                                                              max = 10 000
```

---

## Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                        Borrower                         │
│  1. Encrypts 4 signals client-side (CoFHE SDK)          │
│  2. Submits InEuint32 ciphertexts → CreditScoreRegistry │
│  3. Calls grantLenderApproval(pool, 7000)               │
│     → FHE computes: ebool = (score >= 7000)             │
│  4. Initiates 3-step on-chain reveal                    │
└──────────────────────────┬──────────────────────────────┘
                           │ encrypted approval handle
┌──────────────────────────▼──────────────────────────────┐
│                    LendingPool                          │
│  Reads revealed bool from registry                      │
│  true  → 110 % collateral (credit tier)                 │
│  false → 150 % collateral (standard tier)               │
└─────────────────────────────────────────────────────────┘
```

### Smart Contracts

| Contract | Description |
| --- | --- |
| `CreditScoreRegistry.sol` | Stores encrypted signals, computes FHE weighted score, manages lender approvals and personal rate |
| `LendingPool.sol` | Under-collateralised lending pool; reads on-chain-revealed approval and rate |
| `CreditTierNFT.sol` | Soul-bound ERC-721 encoding Bronze / Silver / Gold tier from revealed rate; on-chain SVG |

### Score computation (all in FHE)

```solidity
euint32 score = FHE.add(
    FHE.add(FHE.add(
        FHE.mul(encBalance,   W_BALANCE),    // ×25
        FHE.mul(encTxFreq,    W_TX_FREQ)),   // ×20
        FHE.mul(encRepayment, W_REPAYMENT)), // ×40
        FHE.mul(FHE.sub(100, encDebtRatio), W_DEBT) // ×15
);
ebool approved = FHE.gte(score, FHE.asEuint32(threshold));
```

### On-chain approval reveal (3-step flow)

```text
1. borrower → registry.grantLenderApproval(pool, 7000)  // FHE comparison
2. borrower → registry.allowApprovalPublic(pool)         // permit decryption
3. keeper   → registry.publishApprovalResult(...)        // threshold-network sig
4. borrower → pool.requestLoan(amount, useCredit=true)   // pool reads result
```

---

## Monorepo Structure

```text
fhenix/
├── cofhe-hardhat-starter/          # Contracts, tasks, tests
│   ├── contracts/
│   │   ├── CreditScoreRegistry.sol
│   │   ├── LendingPool.sol
│   │   └── CreditTierNFT.sol
│   ├── tasks/
│   │   ├── deploy-credit.ts
│   │   ├── submit-credit-data.ts
│   │   └── request-approval.ts
│   └── test/
│       └── CreditScore.test.ts
├── frontend/                       # Next.js 15 App Router UI
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx            # Home
│       │   ├── borrower/page.tsx   # Borrower dashboard
│       │   └── lender/page.tsx     # Lender dashboard
│       ├── components/
│       ├── hooks/
│       │   ├── useCofhe.ts         # CoFHE SDK client lifecycle
│       │   ├── useCreditScore.ts   # Encrypt, submit, rate reveal
│       │   ├── useLendingPool.ts   # Deposit, borrow, repay
│       │   ├── useCreditNFT.ts     # Tier NFT mint and reads
│       │   └── useAutoSignals.ts   # On-chain signal fetching
│       ├── abis/                   # Typed contract ABIs
│       └── config.ts               # Chain + contract addresses
└── packages/
    └── sdk/                        # @ciphercredit/sdk — developer SDK
        └── src/
            ├── client.ts           # CipherCreditClient
            ├── types.ts
            ├── constants.ts
            ├── abis/
            ├── utils/
            └── react/              # wagmi hooks sub-export
```

---

## Quick Start

### 1. Contracts

```bash
cd cofhe-hardhat-starter
pnpm install

# Run tests on local CoFHE network
pnpm localcofhe:test

# Deploy to Arbitrum Sepolia
cp .env.example .env          # add PRIVATE_KEY + RPC URLs
pnpm hardhat deploy-credit --network arb-sepolia

# Submit test credit data
pnpm hardhat submit-credit-data \
  --balance 80 --txfreq 70 --repayment 90 --debtratio 20 \
  --network arb-sepolia

# Grant pool approval and reveal on-chain
pnpm hardhat request-approval --lender pool --network arb-sepolia
```

### 2. Frontend

```bash
cd frontend
npm install

# Add deployed addresses to src/config.ts, then:
npm run dev
# → http://localhost:3000
```

### 3. Developer SDK

```bash
npm install @ciphercredit/sdk
```

### 4. Environment variables

```bash
# cofhe-hardhat-starter/.env
PRIVATE_KEY=0x...
ARB_SEPOLIA_RPC_URL=https://...
BASE_SEPOLIA_RPC_URL=https://...
ARBISCAN_API_KEY=...
BASESCAN_API_KEY=...
```

After deploying, update [frontend/src/config.ts](frontend/src/config.ts) with the printed contract addresses.

---

## Deployed Contracts

### Arbitrum Sepolia

| Contract | Address |
| --- | --- |
| `CreditScoreRegistry` | [`0xb05dB39DF30485aF300874A7fF3BEfDA72F15Ab0`](https://sepolia.arbiscan.io/address/0xb05dB39DF30485aF300874A7fF3BEfDA72F15Ab0) |
| `LendingPool` | [`0x76b09CC00c892c76C18948e9f2ca1Aa43C93321e`](https://sepolia.arbiscan.io/address/0x76b09CC00c892c76C18948e9f2ca1Aa43C93321e) |
| `CreditTierNFT` | [`0x2522743838D43e6EB9532f1EEE452B85F4aAF89E`](https://sepolia.arbiscan.io/address/0x2522743838D43e6EB9532f1EEE452B85F4aAF89E) |

---

## Supported Networks

| Network | Chain ID | CoFHE Support |
| --- | --- | --- |
| Arbitrum Sepolia | 421614 | Testnet |
| Base Sepolia | 84532 | Testnet |
| Local CoFHE | 31337 | Mock (tests only) |

---

## Collateral Tiers

| Borrower type | Collateral required | Condition |
| --- | --- | --- |
| Standard | **150 %** | No credit check |
| Credit-approved | **110 %** | FHE score ≥ 7 000 / 10 000 |

The pool **never learns** the numeric score — only the threshold-network-verified encrypted boolean.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| FHE | [Fhenix CoFHE](https://docs.fhenix.io) — `@cofhe/sdk`, `@cofhe/hardhat-plugin` |
| Contracts | Solidity 0.8.28, Hardhat, TypeChain |
| Frontend | Next.js 15 (App Router), wagmi v2, viem, TailwindCSS |
| SDK | TypeScript, viem, optional wagmi/React hooks |
| Testing | Hardhat + CoFHE mock network |

---

## Key Innovation

Traditional credit scoring on-chain requires revealing financial history — defeating the purpose of self-custody. CipherCredit is the first protocol to:

1. **Compute creditworthiness without seeing the data** — FHE arithmetic on encrypted inputs
2. **Issue selective disclosure** — lenders receive a typed `ebool`, not a score
3. **Enforce credit tiers on-chain** — the lending pool verifies the threshold-network signature
4. **Scale credit limits by tier** — Gold holders get 2× borrowing capacity, proven privately

This unlocks under-collateralised DeFi lending at scale without any trusted intermediary or data exposure.

---

## License

MIT
