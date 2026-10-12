import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { api } from '@/lib/api';
import { isLive } from '@/lib/env';

import { useAccount } from '../use-account';

/**
 * S2 Waiting: alamat (huruf kecil) yang sudah membuka permintaan persetujuan ini. Live: api spend_reviews,
 * polling supaya "Seen" muncul tanpa refresh. Demo: kosong (semua "Not yet").
 */
export function useSeenBy(tripId: string, spendId: string): Set<string> {
  const { account, address } = useAccount();
  const query = useQuery({
    queryKey: ['spendReviews', tripId, address],
    enabled: isLive && Boolean(account),
    refetchInterval: 5000,
    queryFn: () => api.spendReviews(account!, tripId),
  });
  return new Set(
    (query.data ?? []).filter((r) => r.spendId === spendId && r.seenAt).map((r) => r.member.toLowerCase()),
  );
}

/** 10 Approval: catat "Seen" sekali saat anggota lain membuka permintaan. */
export function useMarkSpendSeen(tripId: string, spendId: string, enabled: boolean) {
  const { account } = useAccount();
  useEffect(() => {
    if (!isLive || !enabled || !account) return;
    void api.markSpendSeen(account, tripId, spendId).catch(() => undefined);
  }, [account, enabled, tripId, spendId]);
}
