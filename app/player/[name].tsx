import { useMemo } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CARD, CREAM, GOLD, MUTED, NAVY, serif, SIGNED_IN } from '../../theme';
import { useStore } from '../../store';
import { humanizeDays, playerReigns } from '../../reigns';

const CURRENT_YEAR = new Date().getFullYear();

function InfoRow({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, onPress && styles.infoLink]} onPress={onPress}>
        {value}
        {onPress ? '  ↗' : ''}
      </Text>
    </View>
  );
}

export default function PlayerScreen() {
  const { name: raw } = useLocalSearchParams<{ name: string }>();
  const name = decodeURIComponent(raw ?? '');
  const router = useRouter();
  const { courts, matches, loading, getPlayer, signedUpNames } = useStore();

  const courtNumber = (courtId: string) => courts.find((c) => c.id === courtId)?.number ?? '?';
  const info = getPlayer(name);
  const age = info?.birthYear ? CURRENT_YEAR - info.birthYear : null;
  const from = [info?.hometown, info?.country].filter(Boolean).join(', ');

  const stats = useMemo(() => {
    const reigns = playerReigns(matches, name);
    const totalDays = reigns.reduce((sum, r) => sum + r.days, 0);
    const wins = matches.filter((m) => m.winners?.includes(name)).length;
    const losses = matches.filter((m) => m.losers?.includes(name)).length;
    const current = reigns.filter((r) => r.current);
    return { reigns, totalDays, wins, losses, current };
  }, [matches, name]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: name || 'Player' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.name, signedUpNames.has(name) && { color: SIGNED_IN }]}>{name}</Text>

        {loading ? (
          <ActivityIndicator color={GOLD} style={styles.loader} />
        ) : (
          <>
            {info ? (
              <View style={styles.aboutCard}>
                {from ? <InfoRow label="From" value={from} /> : null}
                {age !== null ? <InfoRow label="Age" value={String(age)} /> : null}
                {info.preferredSide ? <InfoRow label="Side" value={info.preferredSide} /> : null}
                {info.playtomicLevel !== null ? (
                  <InfoRow
                    label="Playtomic"
                    value={`Level ${info.playtomicLevel}`}
                    onPress={
                      info.playtomicUrl ? () => Linking.openURL(info.playtomicUrl!) : undefined
                    }
                  />
                ) : null}
                {info.bio ? <Text style={styles.bio}>“{info.bio}”</Text> : null}
              </View>
            ) : null}

            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{humanizeDays(stats.totalDays)}</Text>
                <Text style={styles.statLabel}>TIME AS CHAMPION</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {stats.wins}–{stats.losses}
                </Text>
                <Text style={styles.statLabel}>MATCH RECORD</Text>
              </View>
            </View>

            {stats.current.length > 0 ? (
              <View style={styles.crownBox}>
                {stats.current.map((r) => (
                  <Text key={r.courtId} style={styles.crownText}>
                    👑 Reigning on Court {courtNumber(r.courtId)} with {r.partner} ·{' '}
                    {humanizeDays(r.days)}
                  </Text>
                ))}
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>Reign history</Text>
            {stats.reigns.length === 0 ? (
              <Text style={styles.empty}>No reigns recorded.</Text>
            ) : (
              stats.reigns.map((r, i) => (
                <Pressable
                  key={`${r.courtId}-${i}`}
                  style={styles.reignRow}
                  onPress={() => router.push(`/court/${r.courtId}`)}
                >
                  <View style={styles.reignInfo}>
                    <Text style={styles.reignCourt}>Court {courtNumber(r.courtId)}</Text>
                    <Text style={styles.reignPartner}>with {r.partner}</Text>
                  </View>
                  <Text style={styles.reignDays}>
                    {humanizeDays(r.days)}
                    {r.current ? ' · now' : ''}
                  </Text>
                </Pressable>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NAVY,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  name: {
    fontSize: 28,
    color: GOLD,
    fontFamily: serif,
    textAlign: 'center',
    marginBottom: 20,
  },
  loader: {
    marginTop: 40,
  },
  aboutCard: {
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(201,162,75,0.35)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  infoLabel: {
    color: MUTED,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: CREAM,
    fontSize: 15,
  },
  infoLink: {
    color: GOLD,
    textDecorationLine: 'underline',
  },
  bio: {
    color: CREAM,
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 4,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201,162,75,0.35)',
  },
  statValue: {
    color: CREAM,
    fontSize: 20,
    fontFamily: serif,
  },
  statLabel: {
    color: MUTED,
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: 6,
  },
  crownBox: {
    backgroundColor: 'rgba(201,162,75,0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD,
    padding: 14,
    marginBottom: 16,
  },
  crownText: {
    color: CREAM,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: GOLD,
    fontFamily: serif,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 6,
  },
  empty: {
    color: MUTED,
    fontSize: 14,
  },
  reignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  reignInfo: {
    flex: 1,
  },
  reignCourt: {
    color: CREAM,
    fontSize: 15,
    fontFamily: serif,
  },
  reignPartner: {
    color: MUTED,
    fontSize: 13,
    marginTop: 2,
  },
  reignDays: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '600',
  },
});
