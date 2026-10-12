import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Logo } from '@/components/logo';
import { Teko } from '@/components/teko';
import { useReceiptSaving } from '@/features/spends/receipt-uploads';
import { ActivityRow } from '@/components/trip-rows';
import { Button } from '@/components/ui/button';
import { Pill, Screen, SectionLabel } from '@/components/ui/layout';
import { Text } from '@/components/ui/text';
import { EmptyState } from '@/components/ui/empty-state';
import { QueryState } from '@/components/query-state';
import { colors, fonts, palette, radius } from '@/constants/theme';
import type { Spend, Trip } from '@/data/types';
import { useTrips } from '@/features/trips/useTrips';
import { money } from '@/lib/money';

// 12 Card (simulated) — canvas "Final UI" › F12Card.
// Kartunya simulasi, uangnya tidak: tiap tap = spend nyata dari pot ke alamat toko demo (FR-16).
// Riwayat kartu = pemakaian pot trip ini (live: Envio), bukan daftar toko contoh.
export default function CardScreen() {
  return (
    <QueryState query={useTrips()} tab headerAction="none">
      {/* Kartu memakai pot trip yang belum settle; kalau semuanya sudah, trip terbaru. */}
      {({ list }) => {
        const trip = list.find((t) => !t.settled) ?? list[0];
        return trip ? <CardView trip={trip} /> : <NoTripCard />;
      }}
    </QueryState>
  );
}

function spendHref(trip: Trip, spend: Spend): Href {
  if (spend.status === 'pending') return `/trip/${trip.id}/spend/${spend.id}/waiting`;
  return `/trip/${trip.id}/spend/${spend.id}`;
}

// Akun baru (mode live) belum punya trip, jadi belum ada pot untuk kartu.
function NoTripCard() {
  return (
    <Screen tab footer={<Button label="Start a trip" onPress={() => router.push('/trip/new')} />}>
      <View style={styles.header}>
        <Text variant="h3" style={{ flex: 1 }}>
          Trip card
        </Text>
        <Pill label="Simulated" bg={palette.butter} />
      </View>
      <EmptyState
        mood="think"
        title="No pot to spend from yet"
        description="Start or join a trip, and its card shows up here."
      />
    </Screen>
  );
}

function CardView({ trip }: { trip: Trip }) {
  const isSavingReceipt = useReceiptSaving(trip.id);
  return (
    <Screen
      tab
      gap={18}
      footer={
        <>
          {!trip.settled && <Button label="Tap to pay" onPress={() => router.push(`/trip/${trip.id}/pay`)} />}
          <Text variant="small" color={colors.textMuted} style={styles.footnote}>
            The card is a demo. Each tap is a real payment from the pot.
          </Text>
        </>
      }>
      <View style={styles.header}>
        <Text variant="h3" style={{ flex: 1 }}>
          Trip card
        </Text>
        <Pill label="Simulated" bg={palette.butter} />
      </View>

      <View style={styles.card}>
        <View style={[styles.deco, { right: -50, top: -60, width: 200, height: 200, backgroundColor: palette.mintCardDeco }]} />
        <View style={[styles.deco, { left: -30, bottom: -70, width: 150, height: 150, backgroundColor: palette.peachSoft }]} />
        <View style={styles.cardTeko}>
          <Teko mood="idle" size={86} />
        </View>
        <View style={styles.cardTop}>
          <Logo size={18} dot={false} />
          <View style={styles.chip} />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, letterSpacing: 3 }}>•••• 4821</Text>
          <Text variant="caption" color={colors.heroText} style={{ fontFamily: fonts.bodySemiBold }}>
            {trip.name} · spends from the pot
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Stat label="Can spend" value={money(trip.pot)} />
        <Stat label="Tap limit" value={money(trip.approvalLimit)} />
      </View>

      <View style={{ gap: 4 }}>
        <View style={{ paddingBottom: 6 }}>
          <SectionLabel>Card history</SectionLabel>
        </View>
        {trip.activity.length === 0 ? (
          <EmptyState
            title="No card payments yet"
            description={trip.settled ? undefined : 'Tap to pay, and each payment from the pot shows up here.'}
          />
        ) : (
          trip.activity.map((spend) => (
            <ActivityRow
              key={spend.id}
              spend={spend}
              savingReceipt={isSavingReceipt(spend.id)}
              meta={`${spend.paidBy.label} · ${spend.status === 'pending' ? 'waiting for a yes' : spend.when}`}
              href={spendHref(trip, spend)}
            />
          ))
        )}
      </View>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="small" color={colors.textMuted} style={{ fontFamily: fonts.body }}>
        {label}
      </Text>
      <Text variant="h3" style={{ fontSize: 22, lineHeight: 28 }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    height: 214,
    borderRadius: 26,
    backgroundColor: palette.mintCard,
    overflow: 'hidden',
    padding: 20,
    justifyContent: 'space-between',
  },
  deco: {
    position: 'absolute',
    borderRadius: 999,
  },
  cardTeko: {
    position: 'absolute',
    right: 14,
    bottom: 6,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chip: {
    width: 36,
    height: 26,
    borderRadius: 6,
    backgroundColor: palette.coin,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
  },
  stat: {
    flex: 1,
    padding: 14,
    borderRadius: radius.row,
    backgroundColor: colors.surface,
  },
  footnote: {
    textAlign: 'center',
    fontFamily: fonts.body,
    lineHeight: 18,
  },
});
