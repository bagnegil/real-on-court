import { StatusBar } from 'expo-status-bar';
import { Link, Stack } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CARD, CREAM, GOLD, MUTED, NAVY, serif } from '../theme';
import { CLUB_NAME, Court } from '../data';
import { useStore } from '../store';
import { ballImg, crownImg } from '../images';

function CourtRow({ court }: { court: Court }) {
  return (
    <Link href={`/court/${court.id}`} asChild>
      <Pressable style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.courtNumber}>Court {court.number}</Text>
          {court.champions ? (
            <Image source={crownImg} style={styles.cardCrown} resizeMode="contain" />
          ) : null}
        </View>

        {court.champions ? (
          <View>
            <Text style={styles.label}>CHAMPIONS</Text>
            <Text style={styles.champions}>
              {court.champions[0]} & {court.champions[1]}
            </Text>
          </View>
        ) : (
          <View>
            <Text style={styles.vacant}>Vacant</Text>
            <Text style={styles.vacantHint}>Be the first to claim it.</Text>
          </View>
        )}

        <Text style={styles.view}>View court ›</Text>
      </Pressable>
    </Link>
  );
}

export default function CourtsScreen() {
  const { courts, loading, error } = useStore();
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Image source={crownImg} style={styles.headerCrown} resizeMode="contain" />
          <View style={styles.titleRow}>
            <Text style={styles.title}>Real </Text>
            <Image source={ballImg} style={styles.ball} resizeMode="contain" />
            <Text style={styles.title}>n Court</Text>
          </View>
        </View>

        <Text style={styles.clubName}>{CLUB_NAME}</Text>
        <Text style={styles.clubSub}>{loading ? 'LOADING…' : `${courts.length} COURTS`}</Text>

        {error ? <Text style={styles.error}>Couldn't load courts: {error}</Text> : null}

        {loading ? (
          <ActivityIndicator color={GOLD} style={styles.loader} />
        ) : (
          courts.map((court) => <CourtRow key={court.id} court={court} />)
        )}
      </ScrollView>
      <StatusBar style="light" />
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 22,
  },
  headerCrown: {
    width: 90,
    aspectRatio: 168 / 96,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: GOLD,
    fontFamily: serif,
  },
  ball: {
    width: 22,
    height: 22,
    marginHorizontal: 1,
  },
  clubName: {
    fontSize: 22,
    color: CREAM,
    fontFamily: serif,
    textAlign: 'center',
  },
  clubSub: {
    fontSize: 12,
    color: MUTED,
    textAlign: 'center',
    marginBottom: 22,
    letterSpacing: 2,
  },
  loader: {
    marginTop: 40,
  },
  error: {
    color: '#D98A8A',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(201,162,75,0.35)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  courtNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GOLD,
    fontFamily: serif,
  },
  cardCrown: {
    width: 34,
    aspectRatio: 168 / 96,
  },
  label: {
    fontSize: 11,
    color: MUTED,
    letterSpacing: 2,
    marginBottom: 4,
  },
  champions: {
    fontSize: 18,
    color: CREAM,
    fontFamily: serif,
  },
  vacant: {
    fontSize: 18,
    color: MUTED,
    fontFamily: serif,
    fontStyle: 'italic',
  },
  vacantHint: {
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },
  view: {
    marginTop: 14,
    fontSize: 13,
    color: GOLD,
    textAlign: 'right',
  },
});
