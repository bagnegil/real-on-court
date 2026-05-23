import { Stack } from 'expo-router';
import { GOLD, NAVY, serif } from '../theme';
import { AuthProvider } from '../auth';
import { StoreProvider } from '../store';

// Web: force English and block browser auto-translation as early as possible
// (runs at bundle load, before content renders), so phones in other locales
// don't translate the UI. Host-independent (doesn't rely on the build patch).
const w: any = globalThis;
if (w.document) {
  w.document.documentElement.setAttribute('translate', 'no');
  w.document.documentElement.lang = 'en';
  if (!w.document.querySelector('meta[name="google"][content="notranslate"]')) {
    const meta = w.document.createElement('meta');
    meta.name = 'google';
    meta.content = 'notranslate';
    w.document.head.appendChild(meta);
  }
}

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
