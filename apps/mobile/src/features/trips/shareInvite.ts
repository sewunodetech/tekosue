import { useCallback } from 'react';
import { Alert, Platform, Share } from 'react-native';

import { recoverInviteCode } from '@/data/live/actions';
import type { Trip } from '@/data/types';
import { isLive } from '@/lib/env';
import { inviteUrl, loadInviteCode } from '@/lib/invite';

import { useAccount } from '../use-account';

/**
 * Live: rahasia undangan tidak pernah dikirim ke server. Disimpan di HP pembuat; kalau tidak ada
 * (HP baru, app dipasang ulang), dibuat ulang dari passkey pembuat (ADR 0017).
 */
export function useShareInvite() {
  const { account } = useAccount();

  return useCallback(
    async (trip: Trip) => {
      let code = await loadInviteCode(trip.id);
      if (!code && isLive && account) {
        const recovered = await recoverInviteCode(account, trip.id).catch(() => null);
        if (recovered === 'notCreator') {
          Alert.alert('Invite link', 'Ask the person who created this trip to share the invite link.');
          return;
        }
        code = recovered;
        if (!code) {
          Alert.alert(
            'Invite link',
            'This trip was started before invite links were tied to your passkey, so its link is only in the Tekosue app you created it with. Share it from there.',
          );
          return;
        }
      }
      if (!code) {
        Alert.alert('Invite link', 'Ask the person who created this trip to share the invite link.');
        return;
      }
      const message = `Join our trip "${trip.name}" on Tekosue: ${inviteUrl(code)}`;
      // Browsers without navigator.share: show the link instead.
      await Share.share({ message }).catch(() => {
        // react-native-web has no Alert; prompt() lets the user copy the link.
        if (Platform.OS === 'web') globalThis.prompt?.('Invite link', inviteUrl(code));
        else Alert.alert('Invite link', inviteUrl(code));
      });
    },
    [account],
  );
}
