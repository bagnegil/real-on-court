import { StatusBar } from 'expo-status-bar';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';

const NAVY = '#182C44';
const GOLD = '#C9A24B';
const CREAM = '#E7D9B0';

const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });

export default function App() {
  return (
    <View style={styles.container}>
      <Image
        source={require('./assets/crown.png')}
        style={styles.crown}
        resizeMode="contain"
      />
      <View style={styles.titleRow}>
        <Text style={styles.title}>Real </Text>
        <Image
          source={require('./assets/ball.png')}
          style={styles.ball}
          resizeMode="contain"
        />
        <Text style={styles.title}>n Court</Text>
      </View>
      <View style={styles.rule} />
      <Text style={styles.tagline}>Claim the court. Defend your crown.</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  crown: {
    width: 150,
    aspectRatio: 168 / 96,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: GOLD,
    fontFamily: serif,
  },
  ball: {
    width: 30,
    height: 30,
    marginHorizontal: 1,
  },
  rule: {
    width: 120,
    height: 1,
    backgroundColor: GOLD,
    marginVertical: 16,
  },
  tagline: {
    fontSize: 16,
    color: CREAM,
    fontFamily: serif,
    textAlign: 'center',
  },
});
