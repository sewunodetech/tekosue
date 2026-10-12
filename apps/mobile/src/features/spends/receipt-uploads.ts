import { useSyncExternalStore } from 'react';

/**
 * Struk yang sedang dilampirkan (enkripsi → unggah → `attachReceipt` → indexer, ±10–30 detik).
 * 09 Pay melampirkannya di latar belakang setelah pembayaran tercatat, jadi tanpa penanda ini
 * baris riwayat sempat menampilkan "No receipt" padahal struknya sedang disimpan.
 */
const saving = new Set<string>();
const listeners = new Set<() => void>();
let snapshot: ReadonlySet<string> = new Set();

const key = (tripId: string, spendId: string) => `${tripId}:${spendId}`;

function emit() {
  snapshot = new Set(saving);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function markReceiptSaving(tripId: string, spendId: string) {
  saving.add(key(tripId, spendId));
  emit();
}

export function clearReceiptSaving(tripId: string, spendId: string) {
  if (saving.delete(key(tripId, spendId))) emit();
}

/** `isSaving(spendId)` untuk satu trip; berubah begitu struk mulai atau selesai disimpan. */
export function useReceiptSaving(tripId: string): (spendId: string) => boolean {
  const current = useSyncExternalStore(subscribe, () => snapshot);
  return (spendId: string) => current.has(key(tripId, spendId));
}
