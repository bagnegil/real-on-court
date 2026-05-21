import { useState } from 'react';
import { Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CARD, CREAM, DANGER, GOLD, MUTED, NAVY, serif } from '../theme';
import { Court } from '../data';
import { useAuth } from '../auth';
import { useStore } from '../store';

function PendingCard({ court }: { court: Court }) {
  const { getClub, getCountry, setCourtStatus, updateCourtW3W } = useStore();
  const club = getClub(court.clubId);
  const country = getCountry(club?.countryId ?? null);
  const [w3w, setW3w] = useState(court.w3w ?? '');
  const [savedW3w, setSavedW3w] = useState(false);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>
        Court {court.number} · {club?.name ?? 'Unknown club'}
      </Text>
      <Text style={styles.cardSub}>{country?.name ?? 'Unknown country'}</Text>

      <Text style={styles.label}>Proposed champions</Text>
      <Text style={styles.champs}>
        {court.champions ? `${court.champions[0]} & ${court.champions[1]}` : '—'}
      </Text>

      <Text style={styles.label}>what3words (edit if inexact)</Text>
      <TextInput
        style={styles.input}
        placeholder="filled.count.soap"
        placeholderTextColor={MUTED}
        autoCapitalize="none"
        value={w3w}
        onChangeText={(t) => {
          setW3w(t);
          setSavedW3w(false);
        }}
      />
      <Pressable
        style={styles.saveLoc}
        onPress={async () => {
          const res = await updateCourtW3W(court.id, w3w.trim());
          if (!res.error) setSavedW3w(true);
        }}
      >
        <Text style={styles.saveLocText}>{savedW3w ? 'Location saved ✓' : 'Save location'}</Text>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          style={[styles.btn, styles.approve]}
          onPress={() => setCourtStatus(court.id, 'approved')}
        >
          <Text style={styles.approveText}>Approve</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.reject]}
          onPress={() => setCourtStatus(court.id, 'rejected')}
        >
          <Text style={styles.rejectText}>Reject</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ApprovalsScreen() {
  const { isOwner } = useAuth();
  const { courts, loading } = useStore();
  const pending = courts.filter((c) => c.status === 'pending');

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Pending approvals' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {!isOwner ? (
          <Text style={styles.help}>Only the app owner can review courts.</Text>
        ) : loading ? (
          <Text style={styles.help}>Loading…</Text>
        ) : pending.length === 0 ? (
          <Text style={styles.help}>No courts waiting for review. 🎉</Text>
        ) : (
          pending.map((court) => <PendingCard key={court.id} court={court} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NAVY },
  scroll: { padding: 20, paddingBottom: 40 },
  help: { color: MUTED, fontSize: 14, padding: 12 },
  card: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(201,162,75,0.35)',
  },
  cardTitle: { fontSize: 18, color: GOLD, fontFamily: serif },
  cardSub: { fontSize: 13, color: MUTED, marginTop: 2 },
  label: {
    fontSize: 11,
    color: MUTED,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 6,
  },
  champs: { fontSize: 16, color: CREAM, fontFamily: serif },
  input: {
    borderWidth: 1,
    borderColor: MUTED,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: CREAM,
    fontSize: 15,
    backgroundColor: NAVY,
  },
  saveLoc: { paddingVertical: 8, marginTop: 6 },
  saveLocText: { color: GOLD, fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  approve: { backgroundColor: GOLD },
  approveText: { color: NAVY, fontWeight: 'bold', fontSize: 14 },
  reject: { borderWidth: 1, borderColor: DANGER },
  rejectText: { color: DANGER, fontWeight: 'bold', fontSize: 14 },
});
