'use client'

import { useState } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { arbitrumSepolia, baseSepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { injected } from 'wagmi/connectors'

const wagmiConfig = createConfig({
  chains:     [arbitrumSepolia, baseSepolia],
  connectors: [injected()],   // injected() auto-detects MetaMask/Rabby/any browser wallet
  ssr:        true,
  transports: {
    [arbitrumSepolia.id]: http(),
    [baseSepolia.id]:     http(),
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
