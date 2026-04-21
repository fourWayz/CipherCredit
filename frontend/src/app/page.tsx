import Link from 'next/link'

const FLOW_STEPS = [
  {
    num: '01',
    title: 'Submit encrypted signals',
    body:  'Four financial metrics encrypted client-side. The contract stores FHE ciphertexts — raw numbers never touch the chain.',
  },
  {
    num: '02',
    title: 'Score computed in FHE',
    body:  'A weighted formula runs entirely on encrypted data. No one — not even the validator — learns your numeric score.',
  },
  {
    num: '03',
    title: 'Lender receives pass/fail only',
    body:  'An encrypted boolean (score ≥ threshold) is revealed to the lender. They see approved or denied — nothing else.',
  },
  {
    num: '04',
    title: 'Access lower collateral',
    body:  'Approved borrowers post 110 % collateral instead of 150 %. Under-collateralised DeFi — finally privacy-safe.',
  },
]

const STATS = [
  { label: 'Collateral saved',        value: '40 pp',    sub: 'for credit-approved borrowers' },
  { label: 'Data exposed',            value: '0 bytes',  sub: 'raw financials never on-chain'  },
  { label: 'Max credit score',        value: '10 000',   sub: 'weighted across 4 signals'       },
  { label: 'Threshold for credit',    value: '≥ 7 000',  sub: '70 % of maximum score'           },
]

export default function HomePage() {
  return (
    <div className="space-y-24">
      {/* Hero */}
      <section className="text-center space-y-6 pt-10">
        <div className="inline-flex items-center gap-2 bg-brand-800/60 border border-brand-700 rounded-full px-4 py-1.5 text-xs font-medium text-brand-300">
          Built on Fhenix CoFHE · Arbitrum Sepolia · Base Sepolia
        </div>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight">
          Credit scoring{' '}
          <span className="text-brand-400">
            without<br />revealing your data
          </span>
        </h1>
        <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
          CipherCredit computes your DeFi credit score using Fully Homomorphic Encryption.
          Lenders see only pass or fail — never your balances, history, or numeric score.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/borrower"
            className="bg-brand-600 hover:bg-brand-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Check my score
          </Link>
          <Link
            href="/lender"
            className="border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Lend capital
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map(s => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-brand-400">{s.value}</div>
            <div className="text-sm font-medium text-white mt-1">{s.label}</div>
            <div className="text-xs text-white/40 mt-1">{s.sub}</div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section className="space-y-10">
        <h2 className="text-3xl font-bold text-center">How it works</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {FLOW_STEPS.map(step => (
            <div
              key={step.num}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 flex gap-4"
            >
              <span className="font-mono text-brand-400 text-xl font-bold shrink-0">{step.num}</span>
              <div>
                <div className="font-semibold text-white mb-1">{step.title}</div>
                <div className="text-sm text-white/50 leading-relaxed">{step.body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Score formula */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4">
        <h3 className="font-bold text-xl">Credit score formula</h3>
        <p className="text-white/50 text-sm">Computed entirely in FHE — max score = 10 000</p>
        <div className="bg-brand-950 rounded-xl p-4 font-mono text-sm text-brand-300 overflow-x-auto">
          score = balance×25 + txFrequency×20 + repaymentHistory×40 + (100−debtRatio)×15
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {[
            { signal: 'Balance score',          weight: '25 %' },
            { signal: 'TX frequency',           weight: '20 %' },
            { signal: 'Repayment history',      weight: '40 %' },
            { signal: 'Debt ratio (inverted)',  weight: '15 %' },
          ].map(r => (
            <div key={r.signal} className="bg-white/5 rounded-lg p-3">
              <div className="text-brand-400 font-bold">{r.weight}</div>
              <div className="text-white/70 mt-0.5">{r.signal}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
