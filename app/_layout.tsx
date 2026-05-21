import { Stack } from 'expo-router';
import { GOLD, NAVY, serif } from '../theme';
import { AuthProvider } from '../auth';
import { StoreProvider } from '../store';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StoreProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: NAVY },
            headerTintColor: GOLD,
            headerTitleStyle: { fontFamily: serif },
            contentStyle: { backgroundColor: NAVY },
          }}
        >
          <Stack.Screen name="login" options={{ presentation: 'modal' }} />
        </Stack>
      </StoreProvider>
    </AuthProvider>
  );
}
