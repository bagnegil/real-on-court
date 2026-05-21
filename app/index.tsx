import { StatusBar } from 'expo-status-bar';
import { Link, Stack, useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CARD, CREAM, DANGER, GOLD, MUTED, NAVY, serif } from '../theme';
import { Court } from '../data';
import { useStore } from '../store';
import { useAuth } from '../auth';
import { ballImg, crownImg } from '../images';

function AuthBar() {
  const router = useRouter();
  const { playerName, signOut } = useAuth();
  return (
    <View style={styles.authBar}>
      {playerName ? (
        <>
          <Pressable onPress={() => router.push('/account')} hitSlop={8} style={styles.authNameWrap}>
            <Text style={styles.authName} numberOfLines={1}>
              {playerName} ›
            </Text>
          </Pressable>
          <Pressable onPress={signOut} hitSlop={8}>
            <Text style={styles.authAction}>Sign out</Text>
          </Pressable>
        </>
      ) : (
        <Pressable onPress={() => router.push('/login')} hitSlop={8}>
          <Text style={styles.authAction}>Sign in</Text>
        </Pressable>
      )}
    </View>
  );
}

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
  const router = useRouter();
  const { courts, clubs, countries, loading, error } = useStore();
  const { playerName, isOwner } = useAuth();

  const approved = courts.filter((c) => c.status === 'approved');
  const pendingCount = courts.filter((c) => c.status === 'pending').length;

  // country -> clubs -> approved courts (only branches that actually have courts)
  const grouped = countries
    .map((country) => ({
      country,
      clubs: clubs
        .filter((cl) => cl.countryId === country.id)
        .map((cl) => ({ club: cl, courts: approved.filter((c) => c.clubId === cl.id) }))
        .filter((g) => g.courts.length > 0),
    }))
    .filter((g) => g.clubs.length > 0);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <AuthBar />
        <View style={styles.header}>
          <Image source={crownImg} style={styles.headerCrown} resizeMode="contain" />
          <View style={styles.titleRow}>
            <Text style={styles.title}>Real </Text>
            <Image source={ballImg} style={styles.ball} resizeMode="contain" />
            <Text style={styles.title}>n Court</Text>
          </View>
        </View>

        <Text style={styles.clubSub}>
          {loading ? 'LOADING…' : `${approved.length} COURTS · ${grouped.length} COUNTRIES`}
        </Text>

        <View style={styles.actionRow}>
          <Pressable style={styles.actionBtn} onPress={() => router.push('/leaderboard')}>
            <Text style={styles.actionBtnText}>🏆  Hall of Fame</Text>
          </Pressable>
          <Pressable
            style={styles.actionBtn}
            onPress={() => router.push(playerName ? '/add-court' : '/login')}
          >
            <Text style={styles.actionBtnText}>＋  Add a court</Text>
          </Pressable>
        </View>

        {isOwner ? (
          <Pressable style={styles.approvalsBtn} onPress={() => router.push('/approvals')}>
            <Text style={styles.approvalsBtnText}>
              🛡  Pending approvals{pendingCount ? ` (${pendingCount})` : ''}
            </Text>
          </Pressable>
        ) : null}

        {error ? <Text style={styles.error}>Couldn't load courts: {error}</Text> : null}

        {loading ? (
          <ActivityIndicator color={GOLD} style={styles.loader} />
        ) : grouped.length === 0 ? (
          <Text style={styles.emptyState}>No courts yet — be the first to add one.</Text>
        ) : (
          grouped.map(({ country, clubs: clubGroups }) => (
            <View key={country.id} style={styles.countryBlock}>
              <Text style={styles.countryHeader}>{country.name}</Text>
              {clubGroups.map(({ club, courts: clubCourts }) => (
                <View key={club.id}>
                  <Text style={styles.clubHeader}>{club.name}</Text>
                  {clubCourts.map((court) => (
                    <CourtRow key={court.id} court={court} />
                  ))}
                </View>
              ))}
            </View>
          ))
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
  authBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  authNameWrap: {
    flexShrink: 1,
  },
  authName: {
    color: CREAM,
    fontSize: 13,
  },
  authAction: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '600',
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
  clubSub: {
    fontSize: 12,
    color: MUTED,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 20,
    paddingVertical: 9,
    alignItems: 'center',
  },
  actionBtnText: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '600',
  },
  approvalsBtn: {
    backgroundColor: 'rgba(201,162,75,0.14)',
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 18,
  },
  approvalsBtnText: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    color: MUTED,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 30,
  },
  countryBlock: {
    marginBottom: 8,
  },
  countryHeader: {
    fontSize: 20,
    color: GOLD,
    fontFamily: serif,
    marginTop: 14,
    marginBottom: 6,
  },
  clubHeader: {
    fontSize: 13,
    color: MUTED,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 10,
  },
  loader: {
    marginTop: 40,
  },
  error: {
    color: DANGER,
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
