import { useCallback } from 'react'
import { useAccount, useChainId, usePublicClient, useReadContract, useWriteContract } from 'wagmi'
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
  const publicClient = usePublicClient()

  //  Pool stats 

  const { data: liquidity,    refetch: refetchLiquidity } = useReadContract({
    address: addr, abi: LendingPoolABI, functionName: 'availableLiquidity',
    query: { enabled: !!addr },
  })

  const { data: totalBorrowed } = useReadContract({
    address: addr, abi: LendingPoolABI, functionName: 'totalBorrowed',
    query: { enabled: !!addr },
  })

  const { data: totalLPBalance } = useReadContract({
    address: addr, abi: LendingPoolABI, functionName: 'totalLPBalance',
    query: { enabled: !!addr },
  })

  const { data: utilisationBps } = useReadContract({
    address: addr, abi: LendingPoolABI, functionName: 'lpUtilisation',
    query: { enabled: !!addr },
  })

  const { data: unclaimedFees } = useReadContract({
    address: addr, abi: LendingPoolABI, functionName: 'unclaimedFees',
    query: { enabled: !!addr },
  })

  //  Collateral ratio constants ─

  const { data: stdCollateral    } = useReadContract({ address: addr, abi: LendingPoolABI, functionName: 'STANDARD_RATIO', query: { enabled: !!addr } })
  const { data: creditCollateral } = useReadContract({ address: addr, abi: LendingPoolABI, functionName: 'CREDIT_RATIO',   query: { enabled: !!addr } })

  //  Provider balance (principal + accrued yield) ─

  const { data: myProviderBalance, refetch: refetchProviderBalance } = useReadContract({
    address: addr, abi: LendingPoolABI, functionName: 'providerBalance',
    args:    address ? [address] : undefined,
    query:   { enabled: !!address && !!addr },
  })

  const { data: myProviderShares } = useReadContract({
    address: addr, abi: LendingPoolABI, functionName: 'providerShares',
    args:    address ? [address] : undefined,
    query:   { enabled: !!address && !!addr },
  })

  //  Current user's loan 

  const { data: activeLoanRaw, refetch: refetchLoan } = useReadContract({
    address: addr, abi: LendingPoolABI, functionName: 'loans',
    args:    address ? [address] : undefined,
    query:   { enabled: !!address && !!addr },
  })

  const activeLoan = activeLoanRaw
    ? {
        principal:       activeLoanRaw[0] as bigint,
        collateral:      activeLoanRaw[1] as bigint,
        creditApproved:  activeLoanRaw[2] as boolean,
        active:          activeLoanRaw[3] as boolean,
        issuedAt:        activeLoanRaw[4] as bigint,
        interestRateBps: activeLoanRaw[5] as number,
        dueDate:         activeLoanRaw[6] as bigint,
      }
    : null

  const { data: accruedInterest } = useReadContract({
    address: addr, abi: LendingPoolABI, functionName: 'getAccruedInterest',
    args:    address ? [address] : undefined,
    query:   { enabled: !!address && !!addr && !!activeLoan?.active, refetchInterval: 15_000 },
  })

  const { data: repaymentDue } = useReadContract({
    address: addr, abi: LendingPoolABI, functionName: 'totalRepaymentDue',
    args:    address ? [address] : undefined,
    query:   { enabled: !!address && !!addr && !!activeLoan?.active, refetchInterval: 15_000 },
  })

  //  Wave 3: repayment history, default count, credit limit 

  const { data: myRepaymentCount, refetch: refetchRepaymentCount } = useReadContract({
    address: addr, abi: LendingPoolABI, functionName: 'repaymentCount',
    args:    address ? [address] : undefined,
    query:   { enabled: !!address && !!addr },
  })

  const { data: myDefaultCount } = useReadContract({
    address: addr, abi: LendingPoolABI, functionName: 'defaultCount',
    args:    address ? [address] : undefined,
    query:   { enabled: !!address && !!addr },
  })

  const { data: maxBorrowableRaw, refetch: refetchMaxBorrowable } = useReadContract({
    address: addr, abi: LendingPoolABI, functionName: 'maxBorrowable',
    args:    address ? [address] : undefined,
    query:   { enabled: !!address && !!addr },
  })

  //  Gas helper 

  const gasFees = useCallback(async () => {
    if (!publicClient) return {}
    const fees = await publicClient.estimateFeesPerGas()
    const fee = fees.maxFeePerGas ?? 0n
    const tip = (fees.maxPriorityFeePerGas != null && fees.maxPriorityFeePerGas > 0n)
      ? fees.maxPriorityFeePerGas
      : fee > 0n ? fee / 10n : 1_000_000n
    return {
      ...(fee > 0n ? { maxFeePerGas: fee } : {}),
      maxPriorityFeePerGas: tip,
    }
  }, [publicClient])

  //  Actions 

  const deposit = useCallback(async (amountEth: string) => {
    if (!addr) throw new Error('Pool not deployed on this chain')
    const hash = await writeContractAsync({
      address: addr, abi: LendingPoolABI, functionName: 'deposit',
      value: parseEther(amountEth),
      ...(await gasFees()),
    })
    await Promise.all([refetchLiquidity(), refetchProviderBalance()])
    return hash
  }, [addr, writeContractAsync, gasFees, refetchLiquidity, refetchProviderBalance])

  const withdraw = useCallback(async (amountEth: string) => {
    if (!addr) throw new Error('Pool not deployed on this chain')
    const hash = await writeContractAsync({
      address: addr, abi: LendingPoolABI, functionName: 'withdraw',
      args: [parseEther(amountEth)],
      ...(await gasFees()),
    })
    await Promise.all([refetchLiquidity(), refetchProviderBalance()])
    return hash
  }, [addr, writeContractAsync, gasFees, refetchLiquidity, refetchProviderBalance])

  const claimFees = useCallback(async () => {
    if (!addr) throw new Error('Pool not deployed on this chain')
    return writeContractAsync({
      address: addr, abi: LendingPoolABI, functionName: 'claimFees',
      ...(await gasFees()),
    })
  }, [addr, writeContractAsync, gasFees])

  const requestLoan = useCallback(async (
    principalEth: string,
    useCredit: boolean,
  ) => {
    if (!addr || !address) throw new Error('Pool not deployed on this chain')
    const principal = parseEther(principalEth)
    const ratio     = useCredit
      ? (creditCollateral != null ? BigInt(creditCollateral as bigint) : 110n)
      : (stdCollateral    != null ? BigInt(stdCollateral as bigint)    : 150n)
    const collateral = (principal * ratio) / 100n

    try {
      await publicClient!.simulateContract({
        address: addr, abi: LendingPoolABI, functionName: 'requestLoan',
        args: [principal, useCredit], value: collateral, account: address,
      })
    } catch (e: any) {
      const msg: string = e?.message ?? String(e)
      const isBalanceOrGasError =
        msg.includes('exceeds the balance') ||
        msg.includes('insufficient funds') ||
        msg.includes('InsufficientFunds') ||
        e?.name === 'InsufficientFundsError'
      if (!isBalanceOrGasError) {
        throw new Error(e?.cause?.reason ?? e?.shortMessage ?? msg)
      }
    }

    const hash = await writeContractAsync({
      address: addr, abi: LendingPoolABI, functionName: 'requestLoan',
      args: [principal, useCredit], value: collateral,
      ...(await gasFees()),
    })
    if (publicClient) await publicClient.waitForTransactionReceipt({ hash })
    await Promise.all([refetchLoan(), refetchMaxBorrowable()])
    return hash
  }, [addr, address, stdCollateral, creditCollateral, writeContractAsync, gasFees, publicClient, refetchLoan, refetchMaxBorrowable])

  const repayLoan = useCallback(async () => {
    if (!addr || repaymentDue == null) throw new Error('Pool not deployed or no active loan')
    const withBuffer = (repaymentDue * 101n) / 100n
    const hash = await writeContractAsync({
      address: addr, abi: LendingPoolABI, functionName: 'repayLoan',
      value: withBuffer,
      ...(await gasFees()),
    })
    if (publicClient) await publicClient.waitForTransactionReceipt({ hash })
    await Promise.all([refetchLoan(), refetchRepaymentCount(), refetchMaxBorrowable(), refetchProviderBalance()])
    return hash
  }, [addr, repaymentDue, writeContractAsync, gasFees, publicClient, refetchLoan, refetchRepaymentCount, refetchMaxBorrowable, refetchProviderBalance])

  const liquidate = useCallback(async (borrowerAddr: string) => {
    if (!addr) throw new Error('Pool not deployed on this chain')
    return writeContractAsync({
      address: addr, abi: LendingPoolABI, functionName: 'liquidate',
      args: [borrowerAddr as `0x${string}`],
      ...(await gasFees()),
    })
  }, [addr, writeContractAsync, gasFees])

  return {
    addr,
    liquidity,
    totalBorrowed,
    totalLPBalance,
    utilisationBps:    utilisationBps != null ? Number(utilisationBps) : 0,
    unclaimedFees,
    myProviderBalance,
    myProviderShares,
    activeLoan,
    accruedInterest,
    repaymentDue,
    myRepaymentCount:  myRepaymentCount != null ? Number(myRepaymentCount) : 0,
    myDefaultCount:    myDefaultCount   != null ? Number(myDefaultCount)   : 0,
    maxBorrowable:     maxBorrowableRaw as bigint | undefined,
    standardRatio:     stdCollateral    ? Number(stdCollateral)    : 150,
    creditRatio:       creditCollateral ? Number(creditCollateral) : 110,
    deposit,
    withdraw,
    claimFees,
    requestLoan,
    repayLoan,
    liquidate,
  }
}
