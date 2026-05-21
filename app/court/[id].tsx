import { useRef, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CARD, CREAM, DANGER, GOLD, MUTED, NAVY, serif, SUCCESS } from '../../theme';
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
import { useAuth } from '../../auth';
import { crownImg } from '../../images';

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

const DECISION_LABEL = { accept: 'Accept', decline: 'Decline', propose: 'Propose' } as const;

// Result recorder for an accepted challenge, including the pair-breaking
// consent flow: the champion who can't play may accept, decline, or propose.
function AcceptedResult({
  champions,
  onResult,
}: {
  champions: [string, string];
  onResult: (defendersWon: boolean, defenders: [string, string]) => void;
}) {
  const [broken, setBroken] = useState(false);
  const [unavailable, setUnavailable] = useState<0 | 1 | null>(null);
  const [decision, setDecision] = useState<'accept' | 'decline' | 'propose' | null>(null);
  const [subName, setSubName] = useState('');
  const [proposed, setProposed] = useState('');
  const [chosen, setChosen] = useState(false);

  function toggleBroken() {
    setBroken((v) => !v);
    setUnavailable(null);
    setDecision(null);
    setSubName('');
    setProposed('');
    setChosen(false);
  }

  function pickUnavailable(i: 0 | 1) {
    setUnavailable(i);
    setDecision(null);
    setSubName('');
    setProposed('');
    setChosen(false);
  }

  function pickDecision(d: 'accept' | 'decline' | 'propose') {
    setDecision(d);
    setSubName('');
    setProposed('');
    setChosen(false);
  }

  const available = unavailable === null ? null : champions[unavailable === 0 ? 1 : 0];

  let defenders: [string, string] = champions;
  let ready = true;
  let note = 'Both champions play.';

  if (broken) {
    ready = false;
    if (unavailable === null || !available) {
      note = 'Pick the champion who cannot play.';
    } else if (decision === 'accept') {
      if (subName.trim()) {
        defenders = [available, subName.trim()];
        ready = true;
        note = `Defending pair: ${available} & ${subName.trim()}`;
      } else {
        note = `${available} chooses a substitute.`;
      }
    } else if (decision === 'propose') {
      if (chosen && proposed.trim()) {
        defenders = [available, proposed.trim()];
        ready = true;
        note = `Defending pair: ${available} & ${proposed.trim()}`;
      } else {
        note = `${champions[unavailable]} proposes a player for ${available} to choose.`;
      }
    } else if (decision === 'decline') {
      note = `${champions[unavailable]} declined — no substitute may be fielded.`;
    } else {
      note = `Waiting for ${champions[unavailable]}'s decision.`;
    }
  }

  return (
    <View style={styles.resultBlock}>
      <Pressable style={styles.subToggle} onPress={toggleBroken}>
        <Text style={styles.subToggleText}>
          {broken ? '☑' : '☐'}  A champion can't play (break the pair)
        </Text>
      </Pressable>

      {broken ? (
        <View style={styles.subForm}>
          <Text style={styles.subLabel}>Who can't play?</Text>
          <View style={styles.subPickRow}>
            {champions.map((n, i) => {
              const on = unavailable === i;
              return (
                <Pressable
                  key={i}
                  style={[styles.subPick, on && styles.subPickOn]}
                  onPress={() => pickUnavailable(i as 0 | 1)}
                >
                  <Text style={[styles.subPickText, on && styles.subPickTextOn]}>{n}</Text>
                </Pressable>
              );
            })}
          </View>

          {unavailable !== null ? (
            <>
              <Text style={styles.subLabel}>{champions[unavailable]}'s decision:</Text>
              <View style={styles.subPickRow}>
                {(['accept', 'decline', 'propose'] as const).map((d) => {
                  const on = decision === d;
                  return (
                    <Pressable
                      key={d}
                      style={[styles.subPick, on && styles.subPickOn]}
                      onPress={() => pickDecision(d)}
                    >
                      <Text style={[styles.subPickText, on && styles.subPickTextOn]}>
                        {DECISION_LABEL[d]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {decision === 'accept' && available ? (
                <TextInput
                  style={styles.input}
                  placeholder={`Substitute chosen by ${available}`}
                  placeholderTextColor={MUTED}
                  value={subName}
                  onChangeText={setSubName}
                />
              ) : null}

              {decision === 'propose' ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder={`Player proposed by ${champions[unavailable]}`}
                    placeholderTextColor={MUTED}
                    value={proposed}
                    onChangeText={(t) => {
                      setProposed(t);
                      setChosen(false);
                    }}
                  />
                  {proposed.trim() && !chosen ? (
                    <Pressable style={styles.chooseBtn} onPress={() => setChosen(true)}>
                      <Text style={styles.chooseBtnText}>
                        {available} chooses {proposed.trim()}
                      </Text>
                    </Pressable>
                  ) : null}
                </>
              ) : null}
            </>
          ) : null}

          <Text style={ready ? styles.subPreview : styles.lineupNote}>{note}</Text>
        </View>
      ) : null}

      <Text style={styles.resultLabel}>Match played — who won?</Text>
      <View style={styles.resultBtns}>
        <Pressable
          style={[styles.resultBtn, styles.resultGold, !ready && styles.resultDisabled]}
          onPress={() => ready && onResult(true, defenders)}
          disabled={!ready}
        >
          <Text style={styles.resultGoldText}>Defenders won</Text>
        </Pressable>
        <Pressable
          style={[styles.resultBtn, styles.resultOutline]}
          onPress={() => onResult(false, defenders)}
        >
          <Text style={styles.resultOutlineText}>Challengers won</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Vacant court: two aspirant pairs play, the winners take the crown.
function VacantClaim({
  me,
  onClaim,
}: {
  me: string;
  onClaim: (winners: [string, string], losers: [string, string]) => void;
}) {
  const [a1, setA1] = useState(me);
  const [a2, setA2] = useState('');
  const [b1, setB1] = useState('');
  const [b2, setB2] = useState('');

  const pairA: [string, string] = [a1.trim(), a2.trim()];
  const pairB: [string, string] = [b1.trim(), b2.trim()];
  const ready = !!(pairA[0] && pairA[1] && pairB[0] && pairB[1]);

  return (
    <View>
      <Text style={styles.sectionTitle}>Claim this court</Text>
      <Text style={styles.help}>
        This court is vacant. Two aspirant pairs play — the winners take the crown.
      </Text>

      <Text style={styles.fieldLabel}>Aspirant pair A</Text>
      <TextInput
        style={[styles.input, styles.inputMb]}
        placeholder="Player 1"
        placeholderTextColor={MUTED}
        value={a1}
        onChangeText={setA1}
      />
      <TextInput
        style={[styles.input, styles.inputMb]}
        placeholder="Player 2"
        placeholderTextColor={MUTED}
        value={a2}
        onChangeText={setA2}
      />

      <Text style={styles.fieldLabel}>Aspirant pair B</Text>
      <TextInput
        style={[styles.input, styles.inputMb]}
        placeholder="Player 1"
        placeholderTextColor={MUTED}
        value={b1}
        onChangeText={setB1}
      />
      <TextInput
        style={[styles.input, styles.inputMb]}
        placeholder="Player 2"
        placeholderTextColor={MUTED}
        value={b2}
        onChangeText={setB2}
      />

      <Text style={styles.resultLabel}>Who won?</Text>
      <View style={styles.resultBtns}>
        <Pressable
          style={[styles.resultBtn, styles.resultGold, !ready && styles.resultDisabled]}
          disabled={!ready}
          onPress={() => ready && onClaim(pairA, pairB)}
        >
          <Text style={styles.resultGoldText}>Pair A won</Text>
        </Pressable>
        <Pressable
          style={[styles.resultBtn, styles.resultOutline, !ready && styles.resultDisabled]}
          disabled={!ready}
          onPress={() => ready && onClaim(pairB, pairA)}
        >
          <Text style={styles.resultOutlineText}>Pair B won</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function CourtDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    loading,
    error,
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
  const router = useRouter();
  const { playerName } = useAuth();

  const [selDay, setSelDay] = useState<string | null>(null);
  const [selTime, setSelTime] = useState<string>('19:00');
  const [partner, setPartner] = useState('');
  const [confirm, setConfirm] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (loading && !court) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Court' }} />
        <ActivityIndicator color={GOLD} style={styles.loader} />
      </View>
    );
  }

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

  async function onPropose() {
    if (!selDay || !playerName || !partner.trim()) return;
    const res = await proposeChallenge(court!.id, selDay, selTime, [playerName, partner.trim()]);
    if (res.error) return; // failure is surfaced via the store error banner
    flash(`✓ Challenge booked: ${selDay} ${selTime} (${BOOKING_MINUTES} min)`);
    setSelDay(null);
    setPartner('');
  }

  async function onResult(challengeId: string, defendersWon: boolean, defenders: [string, string]) {
    const res = await recordChallengeResult(challengeId, defendersWon, defenders);
    if (res.error) return;
    flash(`✓ ${res.note ?? 'Result recorded'}`);
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
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!playerName ? (
          <View style={styles.signInBox}>
            <Text style={styles.signInText}>
              Sign in to challenge for the crown and record results.
            </Text>
            <Pressable style={styles.button} onPress={() => router.push('/login')}>
              <Text style={styles.buttonText}>Sign in</Text>
            </Pressable>
          </View>
        ) : court.champions ? (
          <>
            <Text style={styles.sectionTitle}>Propose a challenge</Text>
            <Text style={styles.help}>
              Pick a day and a kick-off time — the booking is assumed to be at least{' '}
              {BOOKING_MINUTES} minutes. To force a forfeit, the champions must ignore a morning, an
              evening AND a weekend challenge.
            </Text>

            <Text style={styles.fieldLabel}>Your partner</Text>
            <TextInput
              style={[styles.input, styles.partnerInput]}
              placeholder="Partner's name"
              placeholderTextColor={MUTED}
              autoCapitalize="words"
              value={partner}
              onChangeText={setPartner}
            />
            <Text style={styles.challengerNote}>
              Challenging as {playerName} & {partner.trim() || '…'}
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
              style={[
                styles.button,
                (!selDay || !partner.trim()) && styles.buttonDisabled,
              ]}
              onPress={onPropose}
              disabled={!selDay || !partner.trim()}
            >
              <Text style={styles.buttonText}>
                {!partner.trim()
                  ? 'Add your partner'
                  : selDay
                    ? `Propose · ${selDay} ${selTime}`
                    : 'Pick a day first'}
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
                <Pressable
                  style={styles.button}
                  onPress={async () => {
                    const res = await vacateCourt(court.id);
                    if (!res.error) flash('✓ Court vacated — now open to claim');
                  }}
                >
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

                  {c.status === 'accepted' && court.champions ? (
                    <AcceptedResult
                      champions={court.champions}
                      onResult={(won, defenders) => onResult(c.id, won, defenders)}
                    />
                  ) : null}
                </View>
              ))
            )}
          </>
        ) : (
          <VacantClaim
            me={playerName}
            onClaim={async (winners, losers) => {
              const res = await claimVacant(court.id, winners, losers);
              if (res.error) return;
              flash(`✓ ${winners[0]} & ${winners[1]} claimed the crown!`);
            }}
          />
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
    color: SUCCESS,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  error: {
    color: DANGER,
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
    borderColor: SUCCESS,
    backgroundColor: 'rgba(127,203,155,0.15)',
  },
  chipText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextDone: {
    color: SUCCESS,
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
    color: DANGER,
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
  subToggle: {
    paddingVertical: 4,
    marginBottom: 6,
  },
  subToggleText: {
    color: MUTED,
    fontSize: 13,
  },
  subForm: {
    marginBottom: 10,
  },
  subLabel: {
    color: CREAM,
    fontSize: 13,
    marginBottom: 6,
  },
  subPickRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  subPick: {
    borderWidth: 1,
    borderColor: MUTED,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  subPickOn: {
    borderColor: GOLD,
    backgroundColor: 'rgba(201,162,75,0.18)',
  },
  subPickText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: '600',
  },
  subPickTextOn: {
    color: GOLD,
  },
  input: {
    borderWidth: 1,
    borderColor: MUTED,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: CREAM,
    fontSize: 14,
  },
  inputMb: {
    marginBottom: 8,
  },
  subPreview: {
    color: SUCCESS,
    fontSize: 13,
    marginTop: 8,
  },
  lineupNote: {
    color: MUTED,
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
  },
  chooseBtn: {
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  chooseBtnText: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '600',
  },
  resultDisabled: {
    opacity: 0.4,
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
  loader: {
    marginTop: 40,
  },
  signInBox: {
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,162,75,0.35)',
    padding: 18,
    marginBottom: 16,
  },
  signInText: {
    color: CREAM,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  partnerInput: {
    backgroundColor: CARD,
    marginBottom: 8,
  },
  challengerNote: {
    color: MUTED,
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 6,
  },
});
