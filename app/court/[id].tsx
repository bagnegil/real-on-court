import { useRef, useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CARD, CREAM, GOLD, MUTED, NAVY, serif } from '../../theme';
import { DAYS } from '../../data';
import { useStore } from '../../store';
import { crownImg } from '../../images';

export default function CourtDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getCourt, challengesForCourt, proposeChallenge, setChallengeStatus, vacateCourt } = useStore();
  const court = getCourt(id);

  const [confirm, setConfirm] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!court) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Court' }} />
        <Text style={styles.missing}>Court not found.</Text>
      </View>
    );
  }

  function onPropose(day: string) {
    proposeChallenge(court!.id, day);
    setConfirm(`✓ Challenge proposed for ${day}`);
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => setConfirm(null), 2500);
  }

  const courtChallenges = challengesForCourt(court.id);
  const unansweredDays = new Set(
    courtChallenges.filter((c) => c.status !== 'accepted').map((c) => c.day),
  );
  const unansweredCount = unansweredDays.size;
  const canVacate = court.champions !== null && unansweredCount >= 3;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `Court ${court.number}` }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.statusBox}>
          {court.champions ? (
            <View style={styles.center}>
              <Image source={crownImg} style={styles.crown} resizeMode="contain" />
              <Text style={styles.label}>REIGNING CHAMPIONS</Text>
              <Text style={styles.champions}>
                {court.champions[0]} & {court.champions[1]}
              </Text>
            </View>
          ) : (
            <View style={styles.center}>
              <Text style={styles.vacant}>Vacant</Text>
              <Text style={styles.vacantHint}>No champions yet — claim the crown.</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Propose a challenge</Text>
        <Text style={styles.help}>
          Pick a day to challenge for. If the champions ignore 3 challenges on different days,
          they forfeit the court.
        </Text>
        <View style={styles.dayRow}>
          {DAYS.map((d) => (
            <Pressable key={d} style={styles.dayBtn} onPress={() => onPropose(d)}>
              <Text style={styles.dayBtnText}>{d}</Text>
            </Pressable>
          ))}
        </View>

        {confirm ? <Text style={styles.confirm}>{confirm}</Text> : null}

        {court.champions ? (
          <Text style={styles.progress}>
            Unanswered challenges on different days: {unansweredCount} / 3
          </Text>
        ) : null}

        {canVacate ? (
          <View style={styles.forfeitBox}>
            <Text style={styles.forfeitText}>
              The champions ignored 3 challenges on different days. The court is forfeited.
            </Text>
            <Pressable style={styles.button} onPress={() => vacateCourt(court.id)}>
              <Text style={styles.buttonText}>Vacate the court</Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Challenges</Text>
        {courtChallenges.length === 0 ? (
          <Text style={styles.help}>No challenges yet.</Text>
        ) : (
          courtChallenges.map((c) => (
            <View key={c.id} style={styles.challengeRow}>
              <View style={styles.challengeInfo}>
                <Text style={styles.challengeWho}>
                  {c.challenger[0]} & {c.challenger[1]}
                </Text>
                <Text style={styles.challengeDay}>{c.day}</Text>
              </View>

              {c.status === 'pending' ? (
                <View style={styles.actions}>
                  <Pressable
                    style={[styles.smallBtn, styles.accept]}
                    onPress={() => setChallengeStatus(c.id, 'accepted')}
                  >
                    <Text style={styles.acceptText}>Accept</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.smallBtn, styles.decline]}
                    onPress={() => setChallengeStatus(c.id, 'declined')}
                  >
                    <Text style={styles.declineText}>Decline</Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={c.status === 'accepted' ? styles.badgeAccepted : styles.badgeDeclined}>
                  {c.status === 'accepted' ? 'Accepted' : 'Declined'}
                </Text>
              )}
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
  center: {
    alignItems: 'center',
  },
  statusBox: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 24,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: 'rgba(201,162,75,0.35)',
  },
  crown: {
    width: 70,
    aspectRatio: 168 / 96,
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    color: MUTED,
    letterSpacing: 2,
    marginBottom: 6,
  },
  champions: {
    fontSize: 24,
    color: CREAM,
    fontFamily: serif,
    textAlign: 'center',
  },
  vacant: {
    fontSize: 24,
    color: MUTED,
    fontFamily: serif,
    fontStyle: 'italic',
  },
  vacantHint: {
    fontSize: 14,
    color: MUTED,
    marginTop: 6,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    color: GOLD,
    fontFamily: serif,
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 10,
  },
  help: {
    fontSize: 13,
    color: MUTED,
    marginBottom: 12,
    lineHeight: 18,
  },
  dayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  dayBtn: {
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  dayBtnText: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '600',
  },
  confirm: {
    color: '#7FCB9B',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  progress: {
    fontSize: 14,
    color: CREAM,
    marginBottom: 12,
  },
  forfeitBox: {
    backgroundColor: 'rgba(201,162,75,0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD,
    padding: 16,
    marginBottom: 16,
  },
  forfeitText: {
    color: CREAM,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  button: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: NAVY,
    fontSize: 16,
    fontWeight: 'bold',
  },
  challengeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeWho: {
    color: CREAM,
    fontSize: 15,
    fontWeight: '600',
  },
  challengeDay: {
    color: MUTED,
    fontSize: 13,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  smallBtn: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  accept: {
    backgroundColor: GOLD,
  },
  decline: {
    borderWidth: 1,
    borderColor: MUTED,
  },
  acceptText: {
    color: NAVY,
    fontWeight: 'bold',
    fontSize: 13,
  },
  declineText: {
    color: MUTED,
    fontSize: 13,
  },
  badgeAccepted: {
    color: '#7FCB9B',
    fontSize: 13,
    fontWeight: 'bold',
  },
  badgeDeclined: {
    color: '#D98A8A',
    fontSize: 13,
    fontWeight: 'bold',
  },
  missing: {
    color: CREAM,
    fontSize: 16,
    padding: 24,
  },
});
