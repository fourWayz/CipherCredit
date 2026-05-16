/**
 * Format basis points as a human-readable percentage string.
 * @example formatBps(1500) → "15.00%"
 */
export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`
}

/**
 * Convert basis points to APR percentage number.
 * @example bpsToApr(1200) → 12.0
 */
export function bpsToApr(bps: number): number {
  return bps / 100
}

/**
 * Format a wei bigint as a compact ETH string, trimming trailing zeros.
 * @example formatEthShort(1500000000000000n) → "0.0015 ETH"
 */
export function formatEthShort(wei: bigint, decimals = 6): string {
  const eth = Number(wei) / 1e18
  const str = eth.toFixed(decimals).replace(/\.?0+$/, '')
  return `${str} ETH`
}

/**
 * Format a tier credit-limit multiplier as a readable string.
 * @example formatTierMultiplier(1.5) → "1.5×"
 */
export function formatTierMultiplier(multiplier: number): string {
  return `${multiplier}×`
}

/**
 * Format a Unix timestamp (seconds) as a locale date string.
 */
export function formatDate(unixSeconds: bigint | number): string {
  return new Date(Number(unixSeconds) * 1000).toLocaleDateString()
}

/**
 * Returns a human-readable countdown string for a loan due date.
 * @example formatTimeLeft(dueDate) → "12d 4h left" | "OVERDUE"
 */
export function formatTimeLeft(dueDate: Date): string {
  const msLeft = dueDate.getTime() - Date.now()
  if (msLeft <= 0) return 'OVERDUE'
  const days  = Math.floor(msLeft / 86_400_000)
  const hours = Math.floor((msLeft % 86_400_000) / 3_600_000)
  return days > 0 ? `${days}d ${hours}h left` : `${hours}h left`
}
