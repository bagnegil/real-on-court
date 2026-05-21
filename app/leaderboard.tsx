import { useMemo } from 'react';
import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CARD, CREAM, GOLD, MUTED, NAVY, serif } from '../theme';
import { useStore } from '../store';
import { humanizeDays, standingsFromMatches } from '../reigns';
import { PlayerName } from '../PlayerName';

export default function LeaderboardScreen() {
  const router = useRouter();
  const { matches, loading } = useStore();
  const standings = useMemo(() => standingsFromMatches(matches), [matches]);
  const max = standings[0]?.days ?? 1;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Hall of Fame' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Hall of Fame</Text>
        <Text style={styles.subtitle}>Total time holding a crown</Text>

        {loading ? (
          <ActivityIndicator color={GOLD} style={styles.loader} />
        ) : standings.length === 0 ? (
          <Text style={styles.empty}>No reigns recorded yet.</Text>
        ) : (
          standings.map((s, i) => {
            const [n1, n2] = s.label.split(' & ');
            return (
              <View key={s.label} style={styles.row}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rank}>{i + 1}.</Text>
                  <Text style={styles.name} numberOfLines={1}>
                    <PlayerName name={n1} style={styles.link} />
                    <Text> & </Text>
                    <PlayerName name={n2} style={styles.link} />
                  </Text>
                  <Text style={styles.days}>{humanizeDays(s.days)}</Text>
                </View>
                <Pressable style={styles.track} onPress={() => router.push(`/court/${s.courtId}`)}>
                  <View style={[styles.bar, { width: `${Math.max(4, (s.days / max) * 100)}%` }]} />
                </Pressable>
              </View>
            );
          })
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
  title: {
    fontSize: 26,
    color: GOLD,
    fontFamily: serif,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
    letterSpacing: 1,
  },
  loader: {
    marginTop: 40,
  },
  empty: {
    color: MUTED,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
  row: {
    marginBottom: 16,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  rank: {
    color: GOLD,
    fontSize: 14,
    fontWeight: 'bold',
    width: 24,
  },
  name: {
    flex: 1,
    color: CREAM,
    fontSize: 15,
    fontFamily: serif,
  },
  link: {
    color: CREAM,
    textDecorationLine: 'underline',
  },
  days: {
    color: MUTED,
    fontSize: 13,
    marginLeft: 8,
  },
  track: {
    height: 14,
    backgroundColor: CARD,
    borderRadius: 7,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: GOLD,
    borderRadius: 7,
  },
});
