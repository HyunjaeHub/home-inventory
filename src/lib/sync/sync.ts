import { AppState } from 'react-native';

import { DEFAULT_RULES, todayIso, type Rules } from '@/domain';
import { supabase } from '@/lib/supabase';
import { DEFAULT_PREFS, newId, useHome, type Prefs } from '@/stores/home-store';
import { showToast } from '@/stores/toast-store';

import {
  diffSnapshots,
  fromRows,
  TABLES,
  type Changes,
  type People,
  type ServerRows,
  type Snapshot,
} from './rows';

/**
 * 서버 동기화.
 * 화면과 도메인 함수는 그대로 Zustand 스토어(useHome)를 쓰고,
 * 스토어가 바뀔 때마다 이전·이후를 비교해 바뀐 행만 apply_changes RPC로 한 번에 저장한다.
 * 화면은 먼저 바뀌고(낙관적 업데이트), 저장에 실패하면 서버 데이터로 다시 불러온다.
 *
 * 실시간(Phase 6): 같은 가구 테이블이 바뀌었다는 알림(Realtime)을 받거나 앱이 다시 앞으로 오면
 * 서버 데이터를 다시 읽는다. 내 저장이 남아 있거나 읽는 사이 내가 또 바꿨으면 조금 뒤에 다시 시도한다.
 */

export type MemberInfo = { userId: string; displayName: string };

/** 사람마다 다른 설정 (household_members.prefs), 나머지는 가구 공용 (household_settings.prefs) */
const PERSONAL_PREFS = ['expAlert', 'lowAlert', 'alertTime'] as const;

/** 알림이 몰려 와도(먹음 = 로트 + 기록) 한 번만 읽도록 기다리는 시간 */
const REFRESH_DELAY_MS = 400;

type Session = {
  householdId: string;
  myId: string;
  people: People;
  /** 구성원이 바뀌면 (합류·이름 변경) 알려 준다 */
  onMembers: (members: MemberInfo[]) => void;
};

let current: Session | null = null;
let cleanups: (() => void)[] = [];
let queue: Promise<void> = Promise.resolve();
/** 저장 대기 중인 작업 수 */
let pending = 0;
/** 내가 바꿀 때마다 올라간다. 다시 읽는 사이 바뀌었으면 읽은 걸 버린다 */
let localVersion = 0;
/** 저장 실패로 다시 불러오면 올라간다. 그 전에 쌓인 저장은 버린다 */
let generation = 0;
/** 서버 데이터를 스토어에 넣는 중에는 저장하지 않는다 */
let hydrating = false;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

function makePeople(householdId: string, members: MemberInfo[]): People {
  return {
    householdId,
    idOf: (name) => members.find((m) => m.displayName === name)?.userId ?? null,
    nameOf: (id) => members.find((m) => m.userId === id)?.displayName ?? '알 수 없음',
  };
}

const pick = (s: Snapshot): Snapshot => ({
  places: s.places,
  items: s.items,
  shop: s.shop,
  inbox: s.inbox,
  meal: s.meal,
  tasks: s.tasks,
});

const splitPrefs = (prefs: Prefs) => {
  const personal: Record<string, unknown> = {};
  const shared: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(prefs)) {
    ((PERSONAL_PREFS as readonly string[]).includes(k) ? personal : shared)[k] = v;
  }
  return { personal, shared };
};

async function loadAll(s: Session) {
  const results = await Promise.all([
    ...TABLES.map((t) => {
      const q = supabase.from(t).select('*');
      return t === 'item_logs' ? q.order('created_at', { ascending: false }) : q;
    }),
  ]);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
  const rows = Object.fromEntries(TABLES.map((t, i) => [t, results[i].data ?? []])) as ServerRows;

  const [settings, mem] = await Promise.all([
    supabase.from('household_settings').select('rules, prefs').maybeSingle(),
    supabase.from('household_members').select('user_id, display_name, prefs').order('joined_at'),
  ]);
  if (settings.error) throw settings.error;
  if (mem.error) throw mem.error;

  // 구성원 이름이 바뀌었거나 새로 합류했을 수 있으니 이름 표를 새로 만든다
  const members: MemberInfo[] = (mem.data ?? []).map((m) => ({
    userId: m.user_id,
    displayName: m.display_name,
  }));
  s.people = makePeople(s.householdId, members);
  const myPrefs = mem.data?.find((m) => m.user_id === s.myId)?.prefs;

  return {
    members,
    me: members.find((m) => m.userId === s.myId)?.displayName ?? '나',
    partner: members.find((m) => m.userId !== s.myId)?.displayName ?? null,
    ...fromRows(rows, s.people),
    rules: { ...DEFAULT_RULES, ...(settings.data?.rules as Partial<Rules>) },
    prefs: {
      ...DEFAULT_PREFS,
      ...(settings.data?.prefs as Partial<Prefs>),
      ...(myPrefs as Partial<Prefs>),
    },
  };
}

/** 읽은 서버 데이터를 스토어에 넣는다 (저장하지 않음) */
function hydrate(s: Session, data: Awaited<ReturnType<typeof loadAll>>) {
  const { members, ...state } = data;
  hydrating = true;
  useHome.setState({ ...state, today: todayIso(), server: true });
  hydrating = false;
  s.onMembers(members);
}

async function save(s: Session, c: Changes) {
  const { error } = await supabase.rpc('apply_changes', { p: c });
  if (error) throw error;
}

async function saveSettings(s: Session, rules: Rules, prefs: Prefs) {
  const { personal, shared } = splitPrefs(prefs);
  const [a, b] = await Promise.all([
    supabase
      .from('household_settings')
      .update({ rules, prefs: shared, updated_at: new Date().toISOString() })
      .eq('household_id', s.householdId),
    supabase.from('household_members').update({ prefs: personal }).eq('user_id', s.myId),
  ]);
  if (a.error) throw a.error;
  if (b.error) throw b.error;
}

/** 저장에 실패했을 때: 남은 저장을 버리고 서버 데이터로 되돌린다 */
async function reload(s: Session) {
  generation++;
  const data = await loadAll(s);
  if (current === s) hydrate(s, data);
}

/** 다른 폰이 바꿨을 때: 내 변경을 지우지 않게, 저장이 다 끝났고 읽는 사이 바뀐 게 없을 때만 넣는다 */
async function refresh(s: Session) {
  if (current !== s) return;
  if (pending > 0) {
    scheduleRefresh(s);
    return;
  }
  const version = localVersion;
  let data: Awaited<ReturnType<typeof loadAll>>;
  try {
    data = await loadAll(s);
  } catch (e) {
    console.warn('[sync] 다시 읽기 실패', e);
    return;
  }
  if (current !== s) return;
  if (pending > 0 || version !== localVersion) {
    scheduleRefresh(s);
    return;
  }
  hydrate(s, data);
}

function scheduleRefresh(s: Session) {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    refresh(s);
  }, REFRESH_DELAY_MS);
}

function enqueue(s: Session, job: () => Promise<void>) {
  const gen = generation;
  pending++;
  queue = queue.then(async () => {
    try {
      if (gen !== generation || current !== s) return;
      await job();
    } catch (e) {
      console.warn('[sync] 저장 실패', e);
      if (current !== s) return;
      showToast('저장하지 못했어요. 서버 데이터로 되돌렸어요');
      await reload(s).catch(() => {});
    } finally {
      pending--;
    }
  });
}

/** 같은 가구 테이블이 바뀌면 다시 읽는다 (내 저장의 알림도 오지만 결과가 같아 화면은 그대로) */
function listen(s: Session) {
  const channel = supabase.channel(`household:${s.householdId}`);
  for (const table of [...TABLES, 'household_settings', 'household_members']) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table, filter: `household_id=eq.${s.householdId}` },
      () => scheduleRefresh(s)
    );
  }
  channel.subscribe();

  // 백그라운드에 있는 동안 놓친 알림이 있을 수 있어 앱이 앞으로 오면 다시 읽는다
  const appState = AppState.addEventListener('change', (state) => {
    if (state === 'active') scheduleRefresh(s);
  });

  return () => {
    appState.remove();
    supabase.removeChannel(channel);
  };
}

/**
 * 로그인하고 가구가 정해지면 호출: 서버 데이터를 읽어 스토어에 넣고, 변경 저장과 실시간 반영을 시작한다.
 * 읽기에 실패하면 예외를 던진다.
 */
export async function startSync(
  householdId: string,
  myId: string,
  members: MemberInfo[],
  onMembers: (members: MemberInfo[]) => void = () => {}
) {
  stopSync();
  const s: Session = {
    householdId,
    myId,
    people: makePeople(householdId, members),
    onMembers,
  };
  current = s;
  await reload(s);

  const unsubscribe = useHome.subscribe((next, prev) => {
    if (hydrating || current !== s) return;
    const changes = diffSnapshots(pick(prev), pick(next), s.people, newId);
    if (changes) {
      localVersion++;
      enqueue(s, () => save(s, changes));
    }
    if (next.rules !== prev.rules || next.prefs !== prev.prefs) {
      localVersion++;
      const { rules, prefs } = next;
      enqueue(s, () => saveSettings(s, rules, prefs));
    }
  });
  cleanups = [unsubscribe, listen(s)];
}

/** 로그아웃: 저장·실시간 반영을 멈추고 스토어를 비운다 */
export function stopSync() {
  cleanups.forEach((f) => f());
  cleanups = [];
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = null;
  if (!current) return;
  current = null;
  generation++;
  hydrating = true;
  useHome.setState({
    items: [],
    shop: [],
    inbox: [],
    meal: [],
    tasks: [],
    rules: DEFAULT_RULES,
    prefs: DEFAULT_PREFS,
  });
  hydrating = false;
}
