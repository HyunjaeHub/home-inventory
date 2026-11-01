import { Jua_400Regular, useFonts } from '@expo-google-fonts/jua';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Toast } from '@/components/toast';
import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/stores/auth-store';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();
useAuth.getState().init();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Jua_400Regular });
  const status = useAuth((s) => s.status);
  // 폰트와 로그인 상태를 모두 읽은 뒤 스플래시를 내린다
  const ready = (fontsLoaded || fontError != null) && status !== 'loading';

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Protected guard={status === 'ready'}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="item/[id]" />
          <Stack.Screen name="places" />
          <Stack.Screen name="add" options={{ presentation: 'modal' }} />
        </Stack.Protected>
        <Stack.Protected guard={status === 'signedOut'}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
        <Stack.Protected guard={status === 'noHousehold'}>
          <Stack.Screen name="household" />
        </Stack.Protected>
      </Stack>
      <Toast />
    </QueryClientProvider>
  );
}
