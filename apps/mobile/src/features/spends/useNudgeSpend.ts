import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { isLive } from '@/lib/env';

import { requireAccount, useAccount } from '../use-account';

/**
 * S2 Waiting › "Nudge": api mengirim push ke anggota lain lewat token mereka. Tidak pernah memunculkan
 * notifikasi OS di HP sendiri — yang meminta cukup melihat banner "Nudge sent".
 */
export function useNudgeSpend(tripId: string, spendId: string) {
  const { account } = useAccount();

  return useMutation({
    mutationFn: async () => {
      if (isLive) return api.nudgeSpend(requireAccount(account), tripId, spendId);
      // Demo: tidak ada HP lain untuk dikirimi.
      await new Promise((resolve) => setTimeout(resolve, 600));
      return { recipients: 1, sent: 1 };
    },
  });
}
