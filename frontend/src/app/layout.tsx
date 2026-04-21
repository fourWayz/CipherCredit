import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Header } from '@/components/Header'

export const metadata: Metadata = {
  title: 'CipherCredit — FHE-Powered Credit Protocol',
  description: 'Privacy-preserving DeFi credit scoring with Fully Homomorphic Encryption',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="min-h-screen bg-brand-950 text-white font-sans">
            <Header />
            <main className="max-w-6xl mx-auto px-4 py-10">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
