import { useRef, useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CARD, CREAM, GOLD, MUTED, NAVY, serif } from '../../theme';
import {
  BOOKING_MINUTES,
  CATEGORY_LABEL,
  DAYS,
  KICKOFF_TIMES,
  Match,
  REQUIRED_CATEGORIES,
  addMinutes,
  challengeCategory,
} from '../../data';
import { useStore } from '../../store';
import { crownImg } from '../../images';

const ME: [string, string] = ['You', 'Your partner'];

function matchLine(m: Match) {
  if (m.winners && m.losers) {
    return `${m.winners[0]} & ${m.winners[1]} def. ${m.losers[0]} & ${m.losers[1]}`;
  }
  if (m.winners) {
    return `${m.winners[0]} & ${m.winners[1]}`;
  }
  if (m.losers) {
    return `${m.losers[0]} & ${m.losers[1]}`;
  }
  return m.note;
}

export default function CourtDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getCourt,
    challengesForCourt,
    matchesForCourt,
    proposeChallenge,
    setChallengeStatus,
    recordChallengeResult,
    claimVacant,
    vacateCourt,
  } = useStore();
  const court = getCourt(id);

  const [selDay, setSelDay] = useState<string | null>(null);
  const [selTime, setSelTime] = useState<string>('19:00');
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

  function flash(message: string) {
    setConfirm(message);
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => setConfirm(null), 2500);
  }

  function onPropose() {
    if (!selDay) return;
    proposeChallenge(court!.id, selDay, selTime);
    flash(`✓ Challenge booked: ${selDay} ${selTime} (${BOOKING_MINUTES} min)`);
    setSelDay(null);
  }

  function onClaim() {
    claimVacant(court!.id, ME);
    flash('✓ You are the new champions!');
  }

  const courtChallenges = challengesForCourt(court.id);
  const courtMatches = matchesForCourt(court.id);

  const openCategories = new Set(
    courtChallenges
      .filter((c) => c.status !== 'accepted' && c.status !== 'played')
      .map((c) => challengeCategory(c.day, c.time)),
  );
  const coveredCount = REQUIRED_CATEGORIES.filter((c) => openCategories.has(c)).length;
  const canVacate = court.champions !== null && coveredCount === REQUIRED_CATEGORIES.length;

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

        {confirm ? <Text style={styles.confirm}>{confirm}</Text> : null}

        {court.champions ? (
          <>
            <Text style={styles.sectionTitle}>Propose a challenge</Text>
            <Text style={styles.help}>
              Pick a day and a kick-off time — the booking is assumed to be at least{' '}
              {BOOKING_MINUTES} minutes. To force a forfeit, the champions must ignore a morning, an
              evening AND a weekend challenge.
            </Text>

            <Text style={styles.fieldLabel}>Day</Text>
            <View style={styles.dayRow}>
              {DAYS.map((d) => {
                const on = selDay === d;
                return (
                  <Pressable
                    key={d}
                    style={[styles.dayBtn, on && styles.dayBtnOn]}
                    onPress={() => setSelDay(d)}
                  >
                    <Text style={[styles.dayBtnText, on && styles.dayBtnTextOn]}>{d}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Kick-off time</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timeRow}
            >
              {KICKOFF_TIMES.map((t) => {
                const on = selTime === t;
                return (
                  <Pressable
                    key={t}
                    style={[styles.timeChip, on && styles.timeChipOn]}
                    onPress={() => setSelTime(t)}
                  >
                    <Text style={[styles.timeChipText, on && styles.timeChipTextOn]}>{t}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Text style={styles.endHint}>
              {selTime} – {addMinutes(selTime, BOOKING_MINUTES)} ({BOOKING_MINUTES} min) ·{' '}
              {selDay ? CATEGORY_LABEL[challengeCategory(selDay, selTime)] : 'pick a day'}
            </Text>

            <Pressable
              style={[styles.button, !selDay && styles.buttonDisabled]}
              onPress={onPropose}
              disabled={!selDay}
            >
              <Text style={styles.buttonText}>
                {selDay ? `Propose · ${selDay} ${selTime}` : 'Pick a day first'}
              </Text>
            </Pressable>

            <Text style={styles.fieldLabel}>Forfeit progress</Text>
            <View style={styles.chipRow}>
              {REQUIRED_CATEGORIES.map((cat) => {
                const done = openCategories.has(cat);
                return (
                  <View key={cat} style={[styles.chip, done && styles.chipDone]}>
                    <Text style={[styles.chipText, done && styles.chipTextDone]}>
                      {CATEGORY_LABEL[cat]}
                      {done ? '  ✓' : ''}
                    </Text>
                  </View>
                );
              })}
            </View>

            {canVacate ? (
              <View style={styles.forfeitBox}>
                <Text style={styles.forfeitText}>
                  The champions ignored a morning, an evening and a weekend challenge. The court is
                  forfeited.
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
                <View key={c.id} style={styles.challengeCard}>
                  <View style={styles.challengeTop}>
                    <View style={styles.challengeInfo}>
                      <Text style={styles.challengeWho}>
                        {c.challenger[0]} & {c.challenger[1]}
                      </Text>
                      <Text style={styles.challengeDay}>
                        {c.day} · {c.time} ({BOOKING_MINUTES} min) ·{' '}
                        {CATEGORY_LABEL[challengeCategory(c.day, c.time)]}
                      </Text>
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
                    ) : null}
                    {c.status === 'accepted' ? <Text style={styles.badgeAccepted}>Accepted</Text> : null}
                    {c.status === 'declined' ? <Text style={styles.badgeDeclined}>Declined</Text> : null}
                    {c.status === 'played' ? <Text style={styles.badgePlayed}>Played</Text> : null}
                  </View>

                  {c.status === 'accepted' ? (
                    <View style={styles.resultBlock}>
                      <Text style={styles.resultLabel}>Match played — who won?</Text>
                      <View style={styles.resultBtns}>
                        <Pressable
                          style={[styles.resultBtn, styles.resultGold]}
                          onPress={() => {
                            recordChallengeResult(c.id, true);
                            flash('✓ Champions defended the crown');
                          }}
                        >
                          <Text style={styles.resultGoldText}>Champions won</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.resultBtn, styles.resultOutline]}
                          onPress={() => {
                            recordChallengeResult(c.id, false);
                            flash('✓ New champions crowned!');
                          }}
                        >
                          <Text style={styles.resultOutlineText}>Challengers won</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Claim this court</Text>
            <Text style={styles.help}>
              This court has no champions. Win a match against other aspirants to take the crown.
            </Text>
            <Pressable style={styles.button} onPress={onClaim}>
              <Text style={styles.buttonText}>Record a win & claim the crown</Text>
            </Pressable>
          </>
        )}

        <Text style={[styles.sectionTitle, styles.historyTitle]}>History</Text>
        {courtMatches.length === 0 ? (
          <Text style={styles.help}>No matches recorded yet.</Text>
        ) : (
          courtMatches.map((m) => (
            <View key={m.id} style={styles.historyRow}>
              <Text style={styles.historyLine}>{matchLine(m)}</Text>
              <Text style={styles.historyNote}>{m.note}</Text>
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
    marginBottom: 16,
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
  confirm: {
    color: '#7FCB9B',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    color: GOLD,
    fontFamily: serif,
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 10,
  },
  historyTitle: {
    marginTop: 24,
  },
  help: {
    fontSize: 13,
    color: MUTED,
    marginBottom: 12,
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 11,
    color: MUTED,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 6,
  },
  dayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  dayBtn: {
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  dayBtnOn: {
    backgroundColor: GOLD,
  },
  dayBtnText: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '600',
  },
  dayBtnTextOn: {
    color: NAVY,
  },
  timeRow: {
    gap: 8,
    paddingVertical: 2,
    paddingRight: 8,
  },
  timeChip: {
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  timeChipOn: {
    backgroundColor: GOLD,
  },
  timeChipText: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '600',
  },
  timeChipTextOn: {
    color: NAVY,
  },
  endHint: {
    color: MUTED,
    fontSize: 13,
    marginTop: 8,
    marginBottom: 14,
  },
  button: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(201,162,75,0.35)',
  },
  buttonText: {
    color: NAVY,
    fontSize: 16,
    fontWeight: 'bold',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderColor: MUTED,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  chipDone: {
    borderColor: '#7FCB9B',
    backgroundColor: 'rgba(127,203,155,0.15)',
  },
  chipText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextDone: {
    color: '#7FCB9B',
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
  challengeCard: {
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  challengeTop: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: GOLD,
    fontSize: 13,
    fontWeight: 'bold',
  },
  badgeDeclined: {
    color: '#D98A8A',
    fontSize: 13,
    fontWeight: 'bold',
  },
  badgePlayed: {
    color: MUTED,
    fontSize: 13,
    fontWeight: 'bold',
  },
  resultBlock: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(169,185,207,0.2)',
    paddingTop: 12,
  },
  resultLabel: {
    color: CREAM,
    fontSize: 13,
    marginBottom: 8,
  },
  resultBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  resultBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  resultGold: {
    backgroundColor: GOLD,
  },
  resultGoldText: {
    color: NAVY,
    fontWeight: 'bold',
    fontSize: 13,
  },
  resultOutline: {
    borderWidth: 1,
    borderColor: GOLD,
  },
  resultOutlineText: {
    color: GOLD,
    fontWeight: 'bold',
    fontSize: 13,
  },
  historyRow: {
    backgroundColor: CARD,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  historyLine: {
    color: CREAM,
    fontSize: 14,
  },
  historyNote: {
    color: MUTED,
    fontSize: 12,
    marginTop: 2,
  },
  missing: {
    color: CREAM,
    fontSize: 16,
    padding: 24,
  },
});
