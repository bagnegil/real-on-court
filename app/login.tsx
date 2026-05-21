import { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
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
import { CARD, CREAM, DANGER, GOLD, MUTED, NAVY, serif, SUCCESS } from '../theme';
import { useAuth } from '../auth';
import { crownImg } from '../images';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const signingUp = mode === 'up';
  const ready =
    !!email.trim() && password.length >= 6 && (!signingUp || !!name.trim()) && !busy;

  function done() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  async function submit() {
    if (!ready) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const res = signingUp
      ? await signUp(name, email, password)
      : await signIn(email, password);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.needsConfirmation) {
      setNotice('Check your email to confirm your account, then sign in.');
      setMode('in');
      return;
    }
    done();
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: signingUp ? 'Create account' : 'Sign in' }} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Image source={crownImg} style={styles.crown} resizeMode="contain" />
        <Text style={styles.title}>{signingUp ? 'Join the court' : 'Welcome back'}</Text>
        <Text style={styles.help}>
          {signingUp
            ? 'Create a player to challenge for crowns and record results.'
            : 'Sign in to challenge for crowns and record results.'}
        </Text>

        {signingUp ? (
          <>
            <Text style={styles.label}>Player name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Alex R."
              placeholderTextColor={MUTED}
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />
          </>
        ) : null}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={MUTED}
          autoCapitalize="none"
          keyboardType="email-address"
          inputMode="email"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="At least 6 characters"
          placeholderTextColor={MUTED}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        <Pressable
          style={[styles.button, !ready && styles.buttonDisabled]}
          onPress={submit}
          disabled={!ready}
        >
          {busy ? (
            <ActivityIndicator color={NAVY} />
          ) : (
            <Text style={styles.buttonText}>{signingUp ? 'Create account' : 'Sign in'}</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.switch}
          onPress={() => {
            setMode(signingUp ? 'in' : 'up');
            setError(null);
            setNotice(null);
          }}
        >
          <Text style={styles.switchText}>
            {signingUp ? 'Already have an account? Sign in' : "New here? Create an account"}
          </Text>
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
    paddingTop: 40,
  },
  crown: {
    width: 70,
    aspectRatio: 168 / 96,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    color: GOLD,
    fontFamily: serif,
    textAlign: 'center',
  },
  help: {
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
    lineHeight: 18,
  },
  label: {
    fontSize: 11,
    color: MUTED,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 12,
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
  error: {
    color: DANGER,
    fontSize: 13,
    marginTop: 14,
  },
  notice: {
    color: SUCCESS,
    fontSize: 13,
    marginTop: 14,
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
  switch: {
    marginTop: 18,
    alignItems: 'center',
  },
  switchText: {
    color: GOLD,
    fontSize: 14,
  },
});
