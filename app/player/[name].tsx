import { useMemo } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CARD, CREAM, GOLD, MUTED, NAVY, serif } from '../../theme';
import { useStore } from '../../store';
import { humanizeDays, playerReigns } from '../../reigns';

export default function PlayerScreen() {
  const { name: raw } = useLocalSearchParams<{ name: string }>();
  const name = decodeURIComponent(raw ?? '');
  const router = useRouter();
  const { courts, matches, loading } = useStore();

  const courtNumber = (courtId: string) => courts.find((c) => c.id === courtId)?.number ?? '?';

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
        <Text style={styles.name}>{name}</Text>

        {loading ? (
          <ActivityIndicator color={GOLD} style={styles.loader} />
        ) : (
          <>
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
