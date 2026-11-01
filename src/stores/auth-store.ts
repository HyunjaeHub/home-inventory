import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { authErrorText } from '@/features/auth/auth-errors';
import { hasSupabase, supabase } from '@/lib/supabase';
import { startSync, stopSync } from '@/lib/sync/sync';
import { showToast } from '@/stores/toast-store';

export type Member = { userId: string; displayName: string };
export type Household = { id: string; name: string; inviteCode: string };

/**
 * - loading: 저장된 세션·가구를 읽는 중 (스플래시 유지)
 * - signedOut: 로그인 화면
 * - noHousehold: 로그인했지만 가구가 없음 → 가구 만들기/합류 화면
 * - ready: 앱 사용 (Supabase 설정이 없으면 바로 ready: 기기 메모리로만 동작)
 */
export type AuthStatus = 'loading' | 'signedOut' | 'noHousehold' | 'ready';

type AuthState = {
  status: AuthStatus;
  session: Session | null;
  household: Household | null;
  members: Member[];

  /** 앱 시작 시 한 번: 저장된 세션을 읽고 로그인 상태 변화를 구독 */
  init: () => void;
  /** 성공하면 null, 실패하면 화면에 보일 문구 */
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  createHousehold: (displayName: string) => Promise<string | null>;
  joinHousehold: (inviteCode: string, displayName: string) => Promise<string | null>;
  /** 내 가구·구성원을 다시 읽는다 */
  loadHousehold: () => Promise<void>;
};

let started = false;

export const useAuth = create<AuthState>((set, get) => ({
  status: hasSupabase ? 'loading' : 'ready',
  session: null,
  household: null,
  members: [],

  init: () => {
    if (!hasSupabase || started) return;
    started = true;
    // 콜백 안에서 Supabase를 바로 다시 부르면 막힐 수 있어 다음 틱으로 미룬다 (Supabase 문서 권고)
    supabase.auth.onAuthStateChange((event, session) => {
      set({ session });
      // 토큰 갱신(약 1시간마다)·사용자 정보 변경 때는 데이터를 다시 읽지 않는다
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') return;
      setTimeout(() => {
        if (session) get().loadHousehold();
        else {
          stopSync();
          set({ status: 'signedOut', household: null, members: [] });
        }
      }, 0);
    });
  },

  loadHousehold: async () => {
    // RLS 덕분에 내 가구만 보인다
    const [{ data: hh, error }, { data: mem }] = await Promise.all([
      supabase.from('households').select('id, name, invite_code').maybeSingle(),
      supabase.from('household_members').select('user_id, display_name').order('joined_at'),
    ]);
    if (error || !hh) {
      set({ status: 'noHousehold', household: null, members: [] });
      return;
    }
    const members = (mem ?? []).map((m) => ({ userId: m.user_id, displayName: m.display_name }));
    const myId = get().session?.user.id;
    // 우리 집 데이터를 읽은 뒤에 화면을 연다 (그동안 스플래시 유지)
    if (myId) {
      try {
        await startSync(hh.id, myId, members);
      } catch (e) {
        console.warn('[auth] 데이터 불러오기 실패', e);
        showToast('우리 집 데이터를 불러오지 못했어요. 인터넷 연결을 확인해 주세요');
      }
    }
    set({
      status: 'ready',
      household: { id: hh.id, name: hh.name, inviteCode: hh.invite_code },
      members,
    });
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return error ? authErrorText(error) : null;
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) return authErrorText(error);
    // 이메일 인증이 켜져 있으면 세션 없이 돌아온다
    if (!data.session) return '받은편지함에서 인증 메일을 확인한 뒤 로그인해 주세요';
    return null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },

  createHousehold: async (displayName) => {
    const { error } = await supabase.rpc('create_household', { p_display_name: displayName });
    if (error) return authErrorText(error);
    await get().loadHousehold();
    return null;
  },

  joinHousehold: async (inviteCode, displayName) => {
    const { error } = await supabase.rpc('join_household', {
      p_invite_code: inviteCode,
      p_display_name: displayName,
    });
    if (error) return authErrorText(error);
    await get().loadHousehold();
    return null;
  },
}));
