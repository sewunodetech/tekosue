import type { Member, Spend, Trip } from '@/data/types';

/**
 * Siapa yang dimintai persetujuan untuk pembayaran di atas batas: peserta selain pembayar. Kalau pembayar
 * satu-satunya peserta, semua anggota lain (sama dengan api Nudge). Kontrak sendiri membolehkan anggota
 * mana pun selain pembayar; app hanya menawarkan Approve kepada yang dimintai.
 */
export function approversOf(trip: Trip, spend: Spend): Member[] {
  const others = trip.members.filter((m) => m.id !== spend.paidBy.id);
  const sharing = others.filter((m) => spend.shares.some((s) => s.member.id === m.id));
  return sharing.length > 0 ? sharing : others;
}

/** Peran user yang sedang masuk ("You") terhadap permintaan ini. */
export function viewerRole(trip: Trip, spend: Spend): 'asker' | 'approver' | 'viewer' {
  if (spend.paidBy.label === 'You') return 'asker';
  const me = trip.members.find((m) => m.label === 'You');
  return me && approversOf(trip, spend).some((m) => m.id === me.id) ? 'approver' : 'viewer';
}
