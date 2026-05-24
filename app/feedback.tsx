import { useEffect, useState } from 'react';
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
import { CARD, CREAM, DANGER, GOLD, MUTED, NAVY, serif, SUCCESS } from '../theme';
import { useAuth } from '../auth';
import { supabase } from '../supabase';

type FeedbackRow = { id: string; author: string | null; message: string; created_at: string };

export default function FeedbackScreen() {
  const router = useRouter();
  const { playerName, isOwner, session } = useAuth();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [items, setItems] = useState<FeedbackRow[]>([]);

  // Owner sees all submitted feedback (RLS returns rows only to the owner).
  useEffect(() => {
    if (!isOwner) return;
    supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setItems(data as FeedbackRow[]);
      });
  }, [isOwner, sent]);

  async function submit() {
    if (!message.trim() || busy) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.from('feedback').insert({
      author: playerName ?? session?.user.email ?? null,
      message: message.trim(),
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setMessage('');
    setSent(true);
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Feedback' }} />
        <View style={styles.scroll}>
          <Text style={styles.help}>Sign in to send feedback.</Text>
          <Pressable style={styles.button} onPress={() => router.replace('/login')}>
            <Text style={styles.buttonText}>Sign in</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Feedback' }} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>Found a bug or have an idea? Tell us — it goes straight to the team.</Text>
        <TextInput
          style={[styles.input, styles.area]}
          placeholder="Your feedback…"
          placeholderTextColor={MUTED}
          multiline
          value={message}
          onChangeText={(t) => {
            setMessage(t);
            setSent(false);
          }}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {sent ? <Text style={styles.sent}>Thanks! Sent. 🙌</Text> : null}
        <Pressable
          style={[styles.button, !message.trim() && styles.buttonDisabled]}
          onPress={submit}
          disabled={!message.trim() || busy}
        >
          {busy ? <ActivityIndicator color={NAVY} /> : <Text style={styles.buttonText}>Send feedback</Text>}
        </Pressable>

        {isOwner ? (
          <View style={styles.ownerBox}>
            <Text style={styles.ownerTitle}>All feedback ({items.length})</Text>
            {items.length === 0 ? (
              <Text style={styles.help}>Nothing yet.</Text>
            ) : (
              items.map((f) => (
                <View key={f.id} style={styles.fbRow}>
                  <Text style={styles.fbMsg}>{f.message}</Text>
                  <Text style={styles.fbMeta}>
                    {f.author ?? 'anon'} · {new Date(f.created_at).toLocaleDateString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NAVY },
  scroll: { padding: 24 },
  intro: { color: MUTED, fontSize: 14, lineHeight: 20, marginBottom: 14 },
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
  area: { height: 120, textAlignVertical: 'top' },
  error: { color: DANGER, fontSize: 13, marginTop: 12 },
  sent: { color: SUCCESS, fontSize: 14, marginTop: 12 },
  help: { color: MUTED, fontSize: 14, marginBottom: 12 },
  button: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: { backgroundColor: 'rgba(201,162,75,0.35)' },
  buttonText: { color: NAVY, fontSize: 16, fontWeight: 'bold' },
  ownerBox: { marginTop: 32, borderTopWidth: 1, borderTopColor: 'rgba(169,185,207,0.2)', paddingTop: 16 },
  ownerTitle: { color: GOLD, fontSize: 16, fontFamily: serif, marginBottom: 12 },
  fbRow: { backgroundColor: CARD, borderRadius: 10, padding: 12, marginBottom: 8 },
  fbMsg: { color: CREAM, fontSize: 14, lineHeight: 19 },
  fbMeta: { color: MUTED, fontSize: 12, marginTop: 6 },
});
