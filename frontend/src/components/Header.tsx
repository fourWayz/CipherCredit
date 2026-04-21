'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectWallet } from './ConnectWallet'

const NAV = [
  { to: '/',         label: 'Home'   },
  { to: '/borrower', label: 'Borrow' },
  { to: '/lender',   label: 'Lend'   },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="border-b border-white/10 bg-brand-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight text-white">
          <span className="text-brand-400">Cipher</span>Credit
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ to, label }) => (
            <Link
              key={to}
              href={to}
              className={[
                'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
                pathname === to
                  ? 'bg-brand-700 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5',
              ].join(' ')}
            >
              {label}
            </Link>
          ))}
        </nav>

        <ConnectWallet />
      </div>
    </header>
  )
}
