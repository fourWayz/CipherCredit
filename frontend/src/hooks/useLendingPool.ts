import { useCallback } from 'react'
import { useAccount, useChainId, useReadContract, useWriteContract } from 'wagmi'
import { parseEther } from 'viem'
import { LendingPoolABI } from '@/abis/LendingPool'
import { CONTRACT_ADDRESSES } from '@/config'

function poolAddress(chainId: number) {
  return CONTRACT_ADDRESSES[chainId]?.pool
}

export function useLendingPool() {
  const { address } = useAccount()
  const chainId     = useChainId()
  const addr        = poolAddress(chainId)

  const { writeContractAsync } = useWriteContract()

  // ── Pool stats ──────────────────────────────────────────────────────────────

  const { data: liquidity,   refetch: refetchLiquidity   } = useReadContract({
    address: addr,
    abi:     LendingPoolABI,
    functionName: 'availableLiquidity',
    query:   { enabled: !!addr },
  })

  const { data: totalBorrowed } = useReadContract({
    address: addr,
    abi:     LendingPoolABI,
    functionName: 'totalBorrowed',
    query:   { enabled: !!addr },
  })

  const { data: totalDeposited } = useReadContract({
    address: addr,
    abi:     LendingPoolABI,
    functionName: 'totalDeposited',
    query:   { enabled: !!addr },
  })

  // ── Current user's loan ─────────────────────────────────────────────────────

  const { data: activeLoanRaw, refetch: refetchLoan } = useReadContract({
    address: addr,
    abi:     LendingPoolABI,
    functionName: 'loans',
    args:    address ? [address] : undefined,
    query:   { enabled: !!address && !!addr },
  })
  const activeLoan = activeLoanRaw
    ? {
        principal:     activeLoanRaw[0] as bigint,
        collateral:    activeLoanRaw[1] as bigint,
        creditApproved: activeLoanRaw[2] as boolean,
        active:        activeLoanRaw[3] as boolean,
        issuedAt:      activeLoanRaw[4] as bigint,
      }
    : null

  const { data: myDeposit } = useReadContract({
    address: addr,
    abi:     LendingPoolABI,
    functionName: 'providerDeposits',
    args:    address ? [address] : undefined,
    query:   { enabled: !!address && !!addr },
  })

  // ── Actions ─────────────────────────────────────────────────────────────────

  const deposit = useCallback(async (amountEth: string) => {
    if (!addr) throw new Error('Pool not deployed on this chain')
    const hash = await writeContractAsync({
      address: addr,
      abi:     LendingPoolABI,
      functionName: 'deposit',
      value:   parseEther(amountEth),
    })
    await refetchLiquidity()
    return hash
  }, [addr, writeContractAsync, refetchLiquidity])

  const withdraw = useCallback(async (amountEth: string) => {
    if (!addr) throw new Error('Pool not deployed on this chain')
    return writeContractAsync({
      address: addr,
      abi:     LendingPoolABI,
      functionName: 'withdraw',
      args: [parseEther(amountEth)],
    })
  }, [addr, writeContractAsync])

  const requestLoan = useCallback(async (
    principalEth: string,
    collateralEth: string,
    useCredit: boolean,
  ) => {
    if (!addr) throw new Error('Pool not deployed on this chain')
    const hash = await writeContractAsync({
      address: addr,
      abi:     LendingPoolABI,
      functionName: 'requestLoan',
      args:  [parseEther(principalEth), useCredit],
      value: parseEther(collateralEth),
    })
    await refetchLoan()
    return hash
  }, [addr, writeContractAsync, refetchLoan])

  const repayLoan = useCallback(async (principalEth: string) => {
    if (!addr) throw new Error('Pool not deployed on this chain')
    const hash = await writeContractAsync({
      address: addr,
      abi:     LendingPoolABI,
      functionName: 'repayLoan',
      value:   parseEther(principalEth),
    })
    await refetchLoan()
    return hash
  }, [addr, writeContractAsync, refetchLoan])

  // ── Helper: required collateral ─────────────────────────────────────────────

  const { data: stdCollateral } = useReadContract({
    address: addr,
    abi:     LendingPoolABI,
    functionName: 'STANDARD_RATIO',
    query:   { enabled: !!addr },
  })

  const { data: creditCollateral } = useReadContract({
    address: addr,
    abi:     LendingPoolABI,
    functionName: 'CREDIT_RATIO',
    query:   { enabled: !!addr },
  })

  return {
    addr,
    liquidity,
    totalBorrowed,
    totalDeposited,
    activeLoan,
    myDeposit,
    standardRatio:   stdCollateral     ? Number(stdCollateral)    : 150,
    creditRatio:     creditCollateral  ? Number(creditCollateral) : 110,
    deposit,
    withdraw,
    requestLoan,
    repayLoan,
  }
}
