import { useMemo } from 'react';
import { Stack } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CARD, CREAM, GOLD, MUTED, NAVY, serif } from '../theme';
import { Match } from '../data';
import { useStore } from '../store';

type Standing = { label: string; days: number };

const DAY_MS = 86_400_000;

function pairKey(pair: [string, string]) {
  return [...pair].sort().join(' & ');
}

// Reconstruct each court's reigns from its match history and total the time
// each champion pair held a crown. A win by the current holder is a defense
// (no change); a win by a new pair starts a new reign; a forfeit ends one.
// The current holder's reign stays open until now.
function standingsFromMatches(matches: Match[]): Standing[] {
  const totalMs = new Map<string, { label: string; ms: number }>();
  const now = Date.now();

  const byCourt = new Map<string, Match[]>();
  for (const m of matches) {
    const list = byCourt.get(m.courtId) ?? [];
    list.push(m);
    byCourt.set(m.courtId, list);
  }

  for (const list of byCourt.values()) {
    const asc = [...list].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    let holderKey: string | null = null;
    let holderLabel = '';
    let since = 0;

    const closeReign = (end: number) => {
      if (!holderKey) return;
      const entry = totalMs.get(holderKey) ?? { label: holderLabel, ms: 0 };
      entry.ms += Math.max(0, end - since);
      totalMs.set(holderKey, entry);
    };

    for (const m of asc) {
      const t = new Date(m.createdAt).getTime();
      if (m.winners) {
        const key = pairKey(m.winners);
        if (key !== holderKey) {
          closeReign(t);
          holderKey = key;
          holderLabel = `${m.winners[0]} & ${m.winners[1]}`;
          since = t;
        }
      } else {
        closeReign(t);
        holderKey = null;
      }
    }
    closeReign(now);
  }

  return [...totalMs.values()]
    .map((v) => ({ label: v.label, days: Math.round(v.ms / DAY_MS) }))
    .filter((v) => v.days > 0)
    .sort((a, b) => b.days - a.days);
}

function humanize(days: number) {
  if (days < 30) return `${days} day${days === 1 ? '' : 's'}`;
  const months = Math.floor(days / 30);
  const rest = days % 30;
  return rest ? `${months} mo ${rest} d` : `${months} mo`;
}

export default function LeaderboardScreen() {
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
          standings.map((s, i) => (
            <View key={s.label} style={styles.row}>
              <View style={styles.rowHeader}>
                <Text style={styles.rank}>{i + 1}.</Text>
                <Text style={styles.name} numberOfLines={1}>
                  {s.label}
                </Text>
                <Text style={styles.days}>{humanize(s.days)}</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.bar, { width: `${Math.max(4, (s.days / max) * 100)}%` }]} />
              </View>
            </View>
          ))
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
