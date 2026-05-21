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

export default function AccountScreen() {
  const router = useRouter();
  const { session, playerName, updateName, signOut } = useAuth();

  // If the current name is just the email (no real name set), start blank.
  const initial = playerName && playerName !== session?.user.email ? playerName : '';
  const [name, setName] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = !!name.trim() && !busy;

  async function save() {
    if (!ready) return;
    setBusy(true);
    setError(null);
    const res = await updateName(name);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    // Returning to the courts list, where the header now shows the new name, is the confirmation.
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
        <Text style={styles.hint}>This is the name shown on courts and challenges.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={[styles.button, !ready && styles.buttonDisabled]} onPress={save} disabled={!ready}>
          {busy ? <ActivityIndicator color={NAVY} /> : <Text style={styles.buttonText}>Save name</Text>}
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
  hint: {
    fontSize: 13,
    color: MUTED,
    marginTop: 8,
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
