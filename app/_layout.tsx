import { Stack } from 'expo-router';
import { GOLD, NAVY, serif } from '../theme';
import { StoreProvider } from '../store';

export default function RootLayout() {
  return (
    <StoreProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: NAVY },
          headerTintColor: GOLD,
          headerTitleStyle: { fontFamily: serif },
          contentStyle: { backgroundColor: NAVY },
        }}
      />
    </StoreProvider>
  );
}
