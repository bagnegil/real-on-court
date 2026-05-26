import { useMemo } from 'react';
import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CARD, CREAM, GOLD, MUTED, NAVY, serif, SIGNED_IN } from '../theme';
import { useStore } from '../store';

const CURRENT_YEAR = new Date().getFullYear();

export default function PlayersScreen() {
  const router = useRouter();
  const { players, loading, getPlayer, signedUpNames } = useStore();

  const allNames = useMemo(() => {
    const set = new Set<string>();
    signedUpNames.forEach((n) => set.add(n));
    players.forEach((p) => set.add(p.name));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [signedUpNames, players]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Players' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.subtitle}>{allNames.length} PLAYERS</Text>
        <Text style={styles.legend}>
          Names in <Text style={styles.legendSignedIn}>blue</Text> have signed up.
        </Text>

        {loading ? (
          <ActivityIndicator color={GOLD} style={styles.loader} />
        ) : allNames.length === 0 ? (
          <Text style={styles.empty}>No players yet.</Text>
        ) : (
          allNames.map((name) => {
            const p = getPlayer(name);
            const from = [p?.hometown, p?.country].filter(Boolean).join(', ');
            const age = p?.birthYear ? CURRENT_YEAR - p.birthYear : null;
            const meta = [from, age != null ? `${age}y` : null, p?.playtomicLevel != null ? `lvl ${p.playtomicLevel}` : null]
              .filter(Boolean)
              .join(' · ');
            return (
              <Pressable
                key={name}
                style={styles.row}
                onPress={() => router.push(`/player/${encodeURIComponent(name)}`)}
              >
                <Text style={[styles.name, signedUpNames.has(name) && styles.nameSignedIn]}>{name}</Text>
                {meta ? <Text style={styles.meta}>{meta}</Text> : null}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NAVY },
  scroll: { padding: 20, paddingBottom: 40 },
  subtitle: {
    fontSize: 12,
    color: MUTED,
    textAlign: 'center',
    marginBottom: 18,
    letterSpacing: 2,
  },
  loader: { marginTop: 40 },
  empty: { color: MUTED, fontSize: 14, textAlign: 'center', marginTop: 40 },
  row: {
    backgroundColor: CARD,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  name: { color: CREAM, fontSize: 16, fontFamily: serif },
  nameSignedIn: { color: SIGNED_IN },
  meta: { color: MUTED, fontSize: 13, marginTop: 4 },
  legend: {
    color: MUTED,
    fontSize: 12,
    textAlign: 'center',
    marginTop: -10,
    marginBottom: 16,
  },
  legendSignedIn: { color: SIGNED_IN, fontWeight: '600' },
});
