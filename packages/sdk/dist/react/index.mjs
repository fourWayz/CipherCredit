"use client";
import {
  BASE_RATE_BPS,
  CREDIT_TIERS,
  CipherCreditClient,
  MIN_CREDIT_THRESHOLD,
  formatBps,
  formatEthShort,
  formatTierMultiplier,
  formatTimeLeft,
  previewRate,
  previewScore
} from "../chunk-BNMOB4CC.mjs";

// src/react/index.ts
import { useMemo, useEffect, useState } from "react";
import { usePublicClient, useChainId, useAccount } from "wagmi";
function useCipherCredit() {
  const publicClient = usePublicClient();
  const chainId = useChainId();
  return useMemo(() => {
    if (!publicClient) return null;
    try {
      return new CipherCreditClient({ publicClient, chainId });
    } catch {
      return null;
    }
  }, [publicClient, chainId]);
}
function useAsync(factory) {
  const [data, setData] = useState(void 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rev, setRev] = useState(0);
  useEffect(() => {
    if (!factory) {
      setData(void 0);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    factory().then((v) => {
      if (!cancelled) {
        setData(v);
        setLoading(false);
      }
    }).catch((e) => {
      if (!cancelled) {
        setError(String(e));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [factory, rev]);
  const refetch = () => setRev((r) => r + 1);
  return { data, loading, error, refetch };
}
function useCreditTier(borrower) {
  const sdk = useCipherCredit();
  const fn = useMemo(
    () => borrower && sdk ? () => sdk.getTier(borrower) : null,
    [sdk, borrower]
  );
  return useAsync(fn);
}
function useLoanInfo(borrower) {
  const sdk = useCipherCredit();
  const fn = useMemo(
    () => borrower && sdk ? () => sdk.getLoan(borrower) : null,
    [sdk, borrower]
  );
  return useAsync(fn);
}
function useRepaymentStats(borrower) {
  const sdk = useCipherCredit();
  const fn = useMemo(
    () => borrower && sdk ? () => sdk.getRepaymentStats(borrower) : null,
    [sdk, borrower]
  );
  return useAsync(fn);
}
function useMaxBorrowable(borrower) {
  const sdk = useCipherCredit();
  const fn = useMemo(
    () => borrower && sdk ? () => sdk.getMaxBorrowable(borrower) : null,
    [sdk, borrower]
  );
  return useAsync(fn);
}
function useSignals(borrower) {
  const sdk = useCipherCredit();
  const fn = useMemo(
    () => borrower && sdk ? () => sdk.fetchSignals(borrower) : null,
    [sdk, borrower]
  );
  return useAsync(fn);
}
function usePoolStats() {
  const sdk = useCipherCredit();
  const fn = useMemo(() => sdk ? () => sdk.getPoolStats() : null, [sdk]);
  return useAsync(fn);
}
function useBorrowerProfile(pool) {
  const { address } = useAccount();
  const sdk = useCipherCredit();
  const fn = useMemo(
    () => address && sdk ? () => sdk.getBorrowerProfile(address, pool) : null,
    [sdk, address, pool]
  );
  return useAsync(fn);
}
export {
  BASE_RATE_BPS,
  CREDIT_TIERS,
  CipherCreditClient,
  MIN_CREDIT_THRESHOLD,
  formatBps,
  formatEthShort,
  formatTierMultiplier,
  formatTimeLeft,
  previewRate,
  previewScore,
  useBorrowerProfile,
  useCipherCredit,
  useCreditTier,
  useLoanInfo,
  useMaxBorrowable,
  usePoolStats,
  useRepaymentStats,
  useSignals
};
