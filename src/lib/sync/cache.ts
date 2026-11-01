import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Rules } from '@/domain';
import type { Prefs } from '@/stores/home-store';

import type { Snapshot } from './rows';

export type MemberInfo = { userId: string; displayName: string };
export type HouseholdInfo = { id: string; name: string; inviteCode: string };

/** 서버에서 읽은(또는 서버에 저장된) 우리 집 데이터 한 벌 */
export type Loaded = Snapshot & {
  members: MemberInfo[];
  me: string;
  partner: string | null;
  rules: Rules;
  prefs: Prefs;
};

/** 인터넷이 없을 때 보여 줄 마지막 데이터. 로그인한 사람이 다르면 쓰지 않는다 */
type Cached = { userId: string; household: HouseholdInfo; data: Loaded };

const KEY = 'home-cache-v1';
const WRITE_DELAY_MS = 1000;

let timer: ReturnType<typeof setTimeout> | null = null;

/** 마지막 서버 데이터를 폰에 저장 (자주 바뀌므로 1초 모아서) */
export function writeCache(userId: string, household: HouseholdInfo, data: Loaded) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    const value: Cached = { userId, household, data };
    AsyncStorage.setItem(KEY, JSON.stringify(value)).catch((e) =>
      console.warn('[cache] 저장 실패', e)
    );
  }, WRITE_DELAY_MS);
}

export async function readCache(userId: string): Promise<Cached | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as Cached;
    return cached.userId === userId ? cached : null;
  } catch {
    return null;
  }
}

/** 로그아웃하면 지운다 (같은 폰에서 다른 사람이 로그인할 수 있으니) */
export async function clearCache() {
  if (timer) clearTimeout(timer);
  timer = null;
  await AsyncStorage.removeItem(KEY).catch(() => {});
}
