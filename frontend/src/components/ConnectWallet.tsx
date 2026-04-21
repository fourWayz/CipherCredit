'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'

export function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { connect, connectors }  = useConnect()
  const { disconnect }            = useDisconnect()

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-xs text-white/50 font-mono">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="text-xs text-white/60 hover:text-white border border-white/10 hover:border-white/30 rounded-lg px-3 py-1.5 transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  const injected = connectors.find(c => c.id === 'injected') ?? connectors[0]

  return (
    <button
      onClick={() => connect({ connector: injected })}
      className="bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
    >
      Connect Wallet
    </button>
  )
}
