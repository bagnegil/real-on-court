import { Stack } from 'expo-router';
import { GOLD, NAVY, serif } from '../theme';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: NAVY },
        headerTintColor: GOLD,
        headerTitleStyle: { fontFamily: serif },
        contentStyle: { backgroundColor: NAVY },
      }}
    />
  );
}
