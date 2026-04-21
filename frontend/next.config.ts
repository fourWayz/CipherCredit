import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // Pin the tracing root to the frontend package, not the monorepo root
  outputFileTracingRoot: path.join(__dirname),
  webpack(config) {
    // Stub browser-incompatible deps pulled in by MetaMask SDK and WalletConnect
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
      encoding: false,
    }

    // Enable async WASM for @cofhe/sdk (TFHE cryptographic operations)
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    }

    return config
  },
}

export default nextConfig
