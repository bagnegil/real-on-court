import { Stack, useLocalSearchParams } from 'expo-router';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CARD, CREAM, GOLD, MUTED, NAVY, serif } from '../../theme';
import { getCourt } from '../../data';
import { crownImg } from '../../images';

export default function CourtDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const court = getCourt(id);

  if (!court) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Court' }} />
        <Text style={styles.missing}>Court not found.</Text>
      </View>
    );
  }

  const hasChampions = court.champions !== null;

  function onChallenge() {
    Alert.alert(
      hasChampions ? 'Challenge the champions' : 'Claim this court',
      'The challenge system is coming next.',
    );
  }

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

        <Text style={styles.sectionTitle}>History</Text>
        <Text style={styles.historyEmpty}>No matches recorded yet.</Text>

        <Pressable style={styles.button} onPress={onChallenge}>
          <Text style={styles.buttonText}>
            {hasChampions ? 'Challenge the champions' : 'Claim this court'}
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
    marginBottom: 8,
  },
  historyEmpty: {
    fontSize: 14,
    color: MUTED,
    marginBottom: 30,
  },
  button: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: NAVY,
    fontSize: 17,
    fontWeight: 'bold',
    fontFamily: serif,
  },
  missing: {
    color: CREAM,
    fontSize: 16,
    padding: 24,
  },
});
