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
import { PREFERRED_SIDES } from '../data';
import { useAuth } from '../auth';
import { useStore } from '../store';

export default function AccountScreen() {
  const router = useRouter();
  const { session, playerName, updateName, signOut } = useAuth();
  const { getPlayer, updatePlayer } = useStore();

  const me = getPlayer(playerName ?? '');
  // If the current name is just the email (no real name set), start blank.
  const [name, setName] = useState(playerName && playerName !== session?.user.email ? playerName : '');
  const [hometown, setHometown] = useState(me?.hometown ?? '');
  const [country, setCountry] = useState(me?.country ?? '');
  const [birthYear, setBirthYear] = useState(me?.birthYear ? String(me.birthYear) : '');
  const [level, setLevel] = useState(me?.playtomicLevel != null ? String(me.playtomicLevel) : '');
  const [url, setUrl] = useState(me?.playtomicUrl ?? '');
  const [side, setSide] = useState<string | null>(me?.preferredSide ?? null);
  const [bio, setBio] = useState(me?.bio ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = !!name.trim() && !busy;

  async function save() {
    if (!ready) return;
    setBusy(true);
    setError(null);
    if (name.trim() !== playerName) {
      const r = await updateName(name);
      if (r.error) {
        setBusy(false);
        setError(r.error);
        return;
      }
    }
    const r = await updatePlayer(name.trim(), {
      hometown: hometown.trim() || null,
      country: country.trim() || null,
      birthYear: birthYear.trim() ? Number(birthYear) : null,
      playtomicLevel: level.trim() ? Number(level) : null,
      playtomicUrl: url.trim() || null,
      preferredSide: side,
      bio: bio.trim() || null,
    });
    setBusy(false);
    if (r.error) {
      setError(r.error);
      return;
    }
    if (router.canGoBack()) router.back();
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Your profile' }} />
        <Text style={styles.help}>You're signed out.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Your profile' }} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.email}>{session.user.email}</Text>

        <Text style={styles.label}>Player name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Alex R."
          placeholderTextColor={MUTED}
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
        />

        <View style={styles.half}>
          <View style={styles.col}>
            <Text style={styles.label}>Hometown</Text>
            <TextInput style={styles.input} placeholder="City" placeholderTextColor={MUTED} value={hometown} onChangeText={setHometown} />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Country</Text>
            <TextInput style={styles.input} placeholder="Country" placeholderTextColor={MUTED} value={country} onChangeText={setCountry} />
          </View>
        </View>

        <View style={styles.half}>
          <View style={styles.col}>
            <Text style={styles.label}>Birth year</Text>
            <TextInput style={styles.input} placeholder="1995" placeholderTextColor={MUTED} keyboardType="number-pad" value={birthYear} onChangeText={setBirthYear} />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Playtomic level</Text>
            <TextInput style={styles.input} placeholder="3.5" placeholderTextColor={MUTED} keyboardType="decimal-pad" value={level} onChangeText={setLevel} />
          </View>
        </View>

        <Text style={styles.label}>Playtomic profile link</Text>
        <TextInput style={styles.input} placeholder="https://playtomic.io/..." placeholderTextColor={MUTED} autoCapitalize="none" keyboardType="url" value={url} onChangeText={setUrl} />

        <Text style={styles.label}>Preferred side</Text>
        <View style={styles.sideRow}>
          {PREFERRED_SIDES.map((s) => {
            const on = side === s;
            return (
              <Pressable key={s} style={[styles.sideChip, on && styles.sideChipOn]} onPress={() => setSide(on ? null : s)}>
                <Text style={[styles.sideChipText, on && styles.sideChipTextOn]}>{s}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bio]}
          placeholder="A line about your game"
          placeholderTextColor={MUTED}
          multiline
          value={bio}
          onChangeText={setBio}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={[styles.button, !ready && styles.buttonDisabled]} onPress={save} disabled={!ready}>
          {busy ? <ActivityIndicator color={NAVY} /> : <Text style={styles.buttonText}>Save profile</Text>}
        </Pressable>

        <Pressable
          style={styles.signOut}
          onPress={async () => {
            await signOut();
            if (router.canGoBack()) router.back();
          }}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
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
    padding: 24,
  },
  label: {
    fontSize: 11,
    color: MUTED,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 14,
  },
  email: {
    fontSize: 16,
    color: CREAM,
    fontFamily: serif,
  },
  input: {
    borderWidth: 1,
    borderColor: MUTED,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: CREAM,
    fontSize: 15,
    backgroundColor: CARD,
  },
  half: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  bio: {
    height: 70,
    textAlignVertical: 'top',
  },
  sideRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sideChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  sideChipOn: {
    backgroundColor: GOLD,
  },
  sideChipText: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '600',
  },
  sideChipTextOn: {
    color: NAVY,
  },
  error: {
    color: DANGER,
    fontSize: 13,
    marginTop: 14,
  },
  help: {
    color: MUTED,
    fontSize: 14,
    padding: 24,
  },
  button: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(201,162,75,0.35)',
  },
  buttonText: {
    color: NAVY,
    fontSize: 16,
    fontWeight: 'bold',
  },
  signOut: {
    marginTop: 22,
    alignItems: 'center',
  },
  signOutText: {
    color: GOLD,
    fontSize: 14,
  },
});
