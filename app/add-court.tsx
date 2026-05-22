import { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CARD, CREAM, DANGER, GOLD, MUTED, NAVY, serif } from '../theme';
import { useAuth } from '../auth';
import { useStore } from '../store';
import { LocationPicker } from '../LocationPicker';

const NEW = '__new';

export default function AddCourtScreen() {
  const router = useRouter();
  const { playerName } = useAuth();
  const { countries, clubs, addCourt } = useStore();

  const [countryId, setCountryId] = useState<string>('');
  const [newCountry, setNewCountry] = useState('');
  const [clubId, setClubId] = useState<string>('');
  const [newClub, setNewClub] = useState('');
  const [number, setNumber] = useState('');
  const [w3w, setW3w] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [partner, setPartner] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countryChosen = countryId === NEW ? !!newCountry.trim() : !!countryId;
  const clubChosen = clubId === NEW ? !!newClub.trim() : !!clubId;
  const ready =
    !!playerName && countryChosen && clubChosen && !!number.trim() && !!partner.trim() && !busy;

  const clubsInCountry = clubs.filter((c) => c.countryId === countryId);

  function pickCountry(id: string) {
    setCountryId(id);
    setClubId('');
    setNewClub('');
  }

  async function submit() {
    if (!ready || !playerName) return;
    setBusy(true);
    setError(null);
    const res = await addCourt({
      countryId: countryId !== NEW ? countryId : undefined,
      newCountryName: countryId === NEW ? newCountry : undefined,
      clubId: clubId !== NEW ? clubId : undefined,
      newClubName: clubId === NEW ? newClub : undefined,
      number: Number(number),
      w3w: w3w.trim() || null,
      lat,
      lng,
      champions: [playerName, partner.trim()],
    });
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (router.canGoBack()) router.back();
  }

  if (!playerName) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Add a court' }} />
        <View style={styles.scroll}>
          <Text style={styles.help}>Sign in to add a court.</Text>
          <Pressable style={styles.button} onPress={() => router.replace('/login')}>
            <Text style={styles.buttonText}>Sign in</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Add a court' }} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Add a court and claim it with a partner. New courts are reviewed before they go live.
        </Text>

        <Text style={styles.label}>Country</Text>
        <View style={styles.chipWrap}>
          {countries.map((c) => (
            <Chip key={c.id} on={countryId === c.id} label={c.name} onPress={() => pickCountry(c.id)} />
          ))}
          <Chip on={countryId === NEW} label="＋ New" onPress={() => pickCountry(NEW)} />
        </View>
        {countryId === NEW ? (
          <TextInput style={styles.input} placeholder="New country name" placeholderTextColor={MUTED} value={newCountry} onChangeText={setNewCountry} />
        ) : null}

        {countryId ? (
          <>
            <Text style={styles.label}>Club</Text>
            <View style={styles.chipWrap}>
              {countryId !== NEW
                ? clubsInCountry.map((c) => (
                    <Chip key={c.id} on={clubId === c.id} label={c.name} onPress={() => setClubId(c.id)} />
                  ))
                : null}
              <Chip on={clubId === NEW} label="＋ New club" onPress={() => setClubId(NEW)} />
            </View>
            {clubId === NEW ? (
              <TextInput style={styles.input} placeholder="New club name" placeholderTextColor={MUTED} value={newClub} onChangeText={setNewClub} />
            ) : null}
          </>
        ) : null}

        <Text style={styles.label}>Court number</Text>
        <TextInput style={styles.input} placeholder="1" placeholderTextColor={MUTED} keyboardType="number-pad" value={number} onChangeText={setNumber} />

        <Text style={styles.label}>what3words address</Text>
        <TextInput style={styles.input} placeholder="filled.count.soap" placeholderTextColor={MUTED} autoCapitalize="none" value={w3w} onChangeText={setW3w} />
        <Text style={styles.hint}>The 3-word address of the court (from the what3words app). Optional — you can add it later.</Text>

        <Text style={styles.label}>Pin the location</Text>
        <LocationPicker lat={lat} lng={lng} onChange={(la, ln) => { setLat(la); setLng(ln); }} />

        <Text style={styles.label}>Claim it — you & your partner</Text>
        <View style={styles.youRow}>
          <Text style={styles.you}>{playerName}</Text>
          <Text style={styles.amp}>&</Text>
          <TextInput style={[styles.input, styles.partnerInput]} placeholder="Partner's name" placeholderTextColor={MUTED} autoCapitalize="words" value={partner} onChangeText={setPartner} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={[styles.button, !ready && styles.buttonDisabled]} onPress={submit} disabled={!ready}>
          {busy ? <ActivityIndicator color={NAVY} /> : <Text style={styles.buttonText}>Submit for approval</Text>}
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Chip({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, on && styles.chipOn]} onPress={onPress}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NAVY },
  scroll: { padding: 24 },
  intro: { color: MUTED, fontSize: 14, lineHeight: 20, marginBottom: 8 },
  label: {
    fontSize: 11,
    color: MUTED,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipOn: { backgroundColor: GOLD },
  chipText: { color: GOLD, fontSize: 14, fontWeight: '600' },
  chipTextOn: { color: NAVY },
  input: {
    borderWidth: 1,
    borderColor: MUTED,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: CREAM,
    fontSize: 15,
    backgroundColor: CARD,
    marginTop: 8,
  },
  hint: { color: MUTED, fontSize: 13, marginTop: 8 },
  youRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  you: { color: CREAM, fontSize: 15, fontFamily: serif },
  amp: { color: MUTED, fontSize: 15 },
  partnerInput: { flex: 1 },
  error: { color: DANGER, fontSize: 13, marginTop: 14 },
  help: { color: MUTED, fontSize: 14, marginBottom: 16 },
  button: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 26,
  },
  buttonDisabled: { backgroundColor: 'rgba(201,162,75,0.35)' },
  buttonText: { color: NAVY, fontSize: 16, fontWeight: 'bold' },
});
