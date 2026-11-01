import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as aesjs from 'aes-js';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** .env에 Supabase 주소·키가 들어 있는지 (없으면 서버 없이 기기 메모리로만 동작) */
export const hasSupabase = Boolean(url && key);

/**
 * 로그인 세션 저장소. SecureStore는 2KB까지만 담을 수 있어서
 * 세션은 AES로 암호화해 AsyncStorage에 두고, 암호화 키만 SecureStore에 둔다 (Supabase 문서 방식).
 */
class LargeSecureStore {
  private async encrypt(name: string, value: string) {
    const encryptionKey = Crypto.getRandomValues(new Uint8Array(256 / 8));
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encrypted = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await SecureStore.setItemAsync(name, aesjs.utils.hex.fromBytes(encryptionKey));
    return aesjs.utils.hex.fromBytes(encrypted);
  }

  private async decrypt(name: string, value: string) {
    const hexKey = await SecureStore.getItemAsync(name);
    if (!hexKey) return hexKey;
    const cipher = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(hexKey),
      new aesjs.Counter(1)
    );
    return aesjs.utils.utf8.fromBytes(cipher.decrypt(aesjs.utils.hex.toBytes(value)));
  }

  async getItem(name: string) {
    const encrypted = await AsyncStorage.getItem(name);
    return encrypted ? this.decrypt(name, encrypted) : null;
  }

  async setItem(name: string, value: string) {
    await AsyncStorage.setItem(name, await this.encrypt(name, value));
  }

  async removeItem(name: string) {
    await AsyncStorage.removeItem(name);
    await SecureStore.deleteItemAsync(name);
  }
}

export const supabase = createClient(url ?? 'http://localhost', key ?? 'missing', {
  auth: {
    // 웹에는 SecureStore가 없으므로 기본 저장소(localStorage)를 쓴다
    storage: Platform.OS === 'web' ? undefined : new LargeSecureStore(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// 앱이 앞에 있을 때만 토큰을 자동으로 새로 받는다
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
