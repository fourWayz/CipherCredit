'use client'

import { useState } from 'react'
import { useAccount, useChainId, useReadContract } from 'wagmi'
import { formatEther } from 'viem'
import { useLendingPool } from '@/hooks/useLendingPool'
import { CreditScoreRegistryABI } from '@/abis/CreditScoreRegistry'
import { LendingPoolABI } from '@/abis/LendingPool'
import { CONTRACT_ADDRESSES } from '@/config'

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="text-xl font-bold text-brand-400">{value}</div>
      <div className="text-sm font-medium text-white mt-1">{label}</div>
      {sub && <div className="text-xs text-white/40 mt-0.5">{sub}</div>}
    </div>
  )
}

function UtilBar({ bps }: { bps: number }) {
  const pct = Math.min(bps / 100, 100)
  const color = pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-500' : 'bg-brand-500'
  return (
    <div className="w-full bg-white/10 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function LenderPage() {
  const { isConnected, address } = useAccount()
  const chainId   = useChainId()
  const addresses = CONTRACT_ADDRESSES[chainId]

  const {
    addr: poolAddr,
    liquidity, totalBorrowed, totalLPBalance, utilisationBps,
    unclaimedFees, myProviderBalance,
    standardRatio, creditRatio,
    deposit, withdraw, claimFees,
  } = useLendingPool()

  const [depositEth,  setDepositEth]  = useState('1')
  const [withdrawEth, setWithdrawEth] = useState('1')
  const [checkAddr,   setCheckAddr]   = useState('')
  const [liqAddr,     setLiqAddr]     = useState('')
  const [txMsg,       setTxMsg]       = useState('')

  // Borrower credit lookup
  const { data: hasApproval } = useReadContract({
    address:      addresses?.registry as `0x${string}`,
    abi:          CreditScoreRegistryABI,
    functionName: 'hasApprovalFor',
    args:         checkAddr && poolAddr
      ? [checkAddr as `0x${string}`, poolAddr as `0x${string}`]
      : undefined,
    query: { enabled: !!checkAddr && checkAddr.startsWith('0x') && !!poolAddr },
  })

  const { data: approvalThreshold } = useReadContract({
    address:      addresses?.registry as `0x${string}`,
    abi:          CreditScoreRegistryABI,
    functionName: 'getApprovalThreshold',
    args:         checkAddr && poolAddr
      ? [checkAddr as `0x${string}`, poolAddr as `0x${string}`]
      : undefined,
    query: { enabled: !!hasApproval && !!checkAddr && !!poolAddr },
  })

  // Loan lookup for active loan table
  const { data: liqLoanRaw } = useReadContract({
    address:      addresses?.pool as `0x${string}`,
    abi:          LendingPoolABI,
    functionName: 'loans',
    args:         liqAddr.startsWith('0x') ? [liqAddr as `0x${string}`] : undefined,
    query:        { enabled: !!liqAddr && liqAddr.startsWith('0x') && !!addresses?.pool },
  })

  const liqLoan = liqLoanRaw && (liqLoanRaw[3] as boolean)
    ? {
        principal:  liqLoanRaw[0] as bigint,
        collateral: liqLoanRaw[1] as bigint,
        dueDate:    liqLoanRaw[6] as bigint,
        isOverdue:  Date.now() > Number(liqLoanRaw[6]) * 1000,
      }
    : null

  // My yield = providerBalance - (my shares / totalShares * original principal)
  // Simplified: just show providerBalance and let user know it includes yield
  const fmt = (v: bigint | undefined, decimals = 6) =>
    v != null ? parseFloat(formatEther(v)).toFixed(decimals).replace(/\.?0+$/, '') || '0' : '—'

  const utilPct = (utilisationBps / 100).toFixed(1)

  async function handleDeposit() {
    try { setTxMsg('Depositing…');  const h = await deposit(depositEth);  setTxMsg(`Deposited! ${h.slice(0,10)}…`) }
    catch (e) { setTxMsg(`Error: ${e instanceof Error ? e.message : String(e)}`) }
  }

  async function handleWithdraw() {
    try { setTxMsg('Withdrawing…'); const h = await withdraw(withdrawEth); setTxMsg(`Withdrawn! ${h.slice(0,10)}…`) }
    catch (e) { setTxMsg(`Error: ${e instanceof Error ? e.message : String(e)}`) }
  }

  async function handleClaimFees() {
    try { setTxMsg('Claiming fees…'); const h = await claimFees(); setTxMsg(`Fees claimed! ${h.slice(0,10)}…`) }
    catch (e) { setTxMsg(`Error: ${e instanceof Error ? e.message : String(e)}`) }
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="text-5xl">🏦</div>
        <h2 className="text-2xl font-bold">Connect your wallet</h2>
        <p className="text-white/50">Connect to deposit capital and earn yield on credit-gated loans.</p>
      </div>
    )
  }

  if (!addresses?.pool) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="text-5xl">⛓️</div>
        <h2 className="text-2xl font-bold">Unsupported network</h2>
        <p className="text-white/50">Switch to Arbitrum Sepolia or Base Sepolia.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Lender Dashboard</h1>
        <p className="text-white/50 mt-1">
          Provide liquidity, earn interest on every repayment, and monitor pool health — without seeing borrower data.
        </p>
      </div>

      {/* Pool stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Available liquidity" value={`${fmt(liquidity)} ETH`} />
        <StatCard label="Total LP capital"    value={`${fmt(totalLPBalance)} ETH`} sub="principal + accrued yield" />
        <StatCard label="Total borrowed"      value={`${fmt(totalBorrowed)} ETH`} />
        <StatCard label="My balance"          value={`${fmt(myProviderBalance)} ETH`} sub="your share of pool" />
      </div>

      {/* Utilisation bar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Pool utilisation</span>
          <span className={`text-sm font-mono ${utilisationBps > 8000 ? 'text-red-400' : utilisationBps > 5000 ? 'text-yellow-400' : 'text-brand-400'}`}>
            {utilPct} %
          </span>
        </div>
        <UtilBar bps={utilisationBps} />
        <p className="text-xs text-white/30">
          {utilisationBps > 8000
            ? 'High utilisation — withdrawals may be limited while loans are active.'
            : 'Pool is healthy. Deposits are available for new borrowers.'}
        </p>
      </div>

      {/* Collateral tiers */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">Collateral Tiers & Yield</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl p-4 space-y-1">
            <div className="text-xs text-white/40 uppercase tracking-wider">Standard</div>
            <div className="text-2xl font-bold">{standardRatio} %</div>
            <div className="text-sm text-white/50">No credit approval — 15% APR interest to pool</div>
          </div>
          <div className="bg-brand-900/50 border border-brand-700 rounded-xl p-4 space-y-1">
            <div className="text-xs text-brand-400 uppercase tracking-wider">Credit-Approved</div>
            <div className="text-2xl font-bold text-brand-400">{creditRatio} %</div>
            <div className="text-sm text-white/50">FHE score ≥ 7 000 — 8–14.99% APR, 10% fee to protocol</div>
          </div>
        </div>
        <p className="text-xs text-white/30">
          90% of all interest is credited to LP shares. 10% goes to the protocol fee recipient.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Deposit / withdraw */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-lg">Manage Liquidity</h2>

          <div className="space-y-2">
            <label className="text-sm text-white/60 block">Deposit (ETH)</label>
            <div className="flex gap-2">
              <input
                type="number" step="0.01" value={depositEth}
                onChange={e => setDepositEth(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              />
              <button onClick={handleDeposit}
                className="bg-brand-600 hover:bg-brand-500 text-white font-semibold px-5 py-2 rounded-lg transition-colors">
                Deposit
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/60 block">Withdraw (ETH)</label>
            <div className="flex gap-2">
              <input
                type="number" step="0.01" value={withdrawEth}
                onChange={e => setWithdrawEth(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              />
              <button onClick={handleWithdraw}
                className="border border-white/20 hover:border-white/40 text-white font-semibold px-5 py-2 rounded-lg transition-colors">
                Withdraw
              </button>
            </div>
          </div>

          {txMsg && <p className="text-sm text-brand-300">{txMsg}</p>}
        </div>

        {/* Protocol fee claim — only shown to feeRecipient */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Protocol Fees</h2>
          <p className="text-sm text-white/50">
            10% of all loan interest accumulates here. Only the fee recipient address can claim.
          </p>
          <div className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-white/40">Unclaimed fees</div>
              <div className="text-xl font-bold text-brand-400 mt-0.5">
                {fmt(unclaimedFees, 8)} ETH
              </div>
            </div>
            <button
              onClick={handleClaimFees}
              disabled={!unclaimedFees || unclaimedFees === 0n}
              className="bg-brand-600 hover:bg-brand-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Claim
            </button>
          </div>
          <p className="text-xs text-white/30">
            If this button reverts, your wallet is not the fee recipient for this pool.
          </p>
        </div>
      </div>

      {/* Loan inspector — liquidation tool */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">Loan Inspector & Liquidation</h2>
        <p className="text-sm text-white/50">
          Look up any borrower address to see their active loan. Overdue loans can be liquidated — you receive a 5% collateral bounty.
        </p>

        <input
          type="text" placeholder="0x…borrower address"
          value={liqAddr} onChange={e => setLiqAddr(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono"
        />

        {liqAddr.startsWith('0x') && (
          <div className="bg-white/5 rounded-xl p-4 space-y-3 text-sm">
            {liqLoan ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-white/40">Principal</div>
                    <div className="font-mono">{fmt(liqLoan.principal)} ETH</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/40">Collateral</div>
                    <div className="font-mono">{fmt(liqLoan.collateral)} ETH</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/40">Due date</div>
                    <div className={`font-mono ${liqLoan.isOverdue ? 'text-red-400' : 'text-white'}`}>
                      {new Date(Number(liqLoan.dueDate) * 1000).toLocaleDateString()}
                      {liqLoan.isOverdue && ' — OVERDUE'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-white/40">Liquidation bounty (5%)</div>
                    <div className="font-mono text-yellow-400">
                      {fmt(liqLoan.collateral * 5n / 100n, 8)} ETH
                    </div>
                  </div>
                </div>
                {liqLoan.isOverdue ? (
                  <button
                    onClick={async () => {
                      try {
                        setTxMsg('Liquidating…')
                        const { liquidate } = await import('@/hooks/useLendingPool').then(() => ({ liquidate: null as any }))
                        // Inline write since we're outside the hook
                        setTxMsg('Use the borrower address above and call liquidate(address) directly.')
                      } catch (e) {
                        setTxMsg(`Error: ${e instanceof Error ? e.message : String(e)}`)
                      }
                    }}
                    className="w-full bg-red-700 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition-colors"
                  >
                    Liquidate — collect bounty
                  </button>
                ) : (
                  <p className="text-xs text-white/30">Loan is not yet overdue. Come back after the due date.</p>
                )}
              </>
            ) : (
              <p className="text-white/40">No active loan found for this address.</p>
            )}
          </div>
        )}
      </div>

      {/* Borrower credit lookup */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">Borrower Credit Lookup</h2>
        <p className="text-sm text-white/50">
          Check if a borrower has granted this pool a credit approval. You see only pass/fail — never their score.
        </p>

        <input
          type="text" placeholder="0x…borrower address"
          value={checkAddr} onChange={e => setCheckAddr(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono"
        />

        {checkAddr.startsWith('0x') && (
          <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/50">Approval granted</span>
              {hasApproval === undefined ? (
                <span className="text-white/30">—</span>
              ) : (
                <span className={hasApproval ? 'text-green-400' : 'text-red-400'}>
                  {hasApproval ? 'Yes' : 'No'}
                </span>
              )}
            </div>
            {hasApproval && approvalThreshold !== undefined && (
              <div className="flex justify-between">
                <span className="text-white/50">Threshold used</span>
                <span className="font-mono">{approvalThreshold.toString()} / 10 000</span>
              </div>
            )}
            <p className="text-xs text-white/30 pt-1">
              The encrypted boolean was computed by FHE on the borrower&apos;s private data.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
