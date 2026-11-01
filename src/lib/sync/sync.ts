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
 * 서버 동기화 (Phase 5).
 * 화면과 도메인 함수는 그대로 Zustand 스토어(useHome)를 쓰고,
 * 스토어가 바뀔 때마다 이전·이후를 비교해 바뀐 행만 apply_changes RPC로 한 번에 저장한다.
 * 화면은 먼저 바뀌고(낙관적 업데이트), 저장에 실패하면 서버 데이터로 다시 불러온다.
 */

export type MemberInfo = { userId: string; displayName: string };

/** 사람마다 다른 설정 (household_members.prefs), 나머지는 가구 공용 (household_settings.prefs) */
const PERSONAL_PREFS = ['expAlert', 'lowAlert', 'alertTime'] as const;

type Session = { householdId: string; myId: string; people: People };

let current: Session | null = null;
let unsubscribe: (() => void) | null = null;
let queue: Promise<void> = Promise.resolve();
/** 다시 불러오면 올라간다. 그 전에 쌓인 저장은 버린다 */
let generation = 0;
/** 서버 데이터를 스토어에 넣는 중에는 저장하지 않는다 */
let hydrating = false;

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

  const [settings, me] = await Promise.all([
    supabase.from('household_settings').select('rules, prefs').maybeSingle(),
    supabase.from('household_members').select('prefs').eq('user_id', s.myId).maybeSingle(),
  ]);
  if (settings.error) throw settings.error;
  if (me.error) throw me.error;

  return {
    ...fromRows(rows, s.people),
    rules: { ...DEFAULT_RULES, ...(settings.data?.rules as Partial<Rules>) },
    prefs: {
      ...DEFAULT_PREFS,
      ...(settings.data?.prefs as Partial<Prefs>),
      ...(me.data?.prefs as Partial<Prefs>),
    },
  };
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

/** 서버 데이터로 스토어를 채운다 */
async function reload(s: Session) {
  generation++;
  const data = await loadAll(s);
  if (current !== s) return;
  hydrating = true;
  useHome.setState({ ...data, today: todayIso(), server: true });
  hydrating = false;
}

function enqueue(s: Session, job: () => Promise<void>) {
  const gen = generation;
  queue = queue.then(async () => {
    if (gen !== generation || current !== s) return;
    try {
      await job();
    } catch (e) {
      console.warn('[sync] 저장 실패', e);
      if (current !== s) return;
      showToast('저장하지 못했어요. 서버 데이터로 되돌렸어요');
      await reload(s).catch(() => {});
    }
  });
}

/**
 * 로그인하고 가구가 정해지면 호출: 서버 데이터를 읽어 스토어에 넣고 변경 저장을 시작한다.
 * 읽기에 실패하면 예외를 던진다.
 */
export async function startSync(householdId: string, myId: string, members: MemberInfo[]) {
  stopSync();
  const s: Session = { householdId, myId, people: makePeople(householdId, members) };
  current = s;
  const me = members.find((m) => m.userId === myId)?.displayName ?? '나';
  const partner = members.find((m) => m.userId !== myId)?.displayName ?? null;
  useHome.setState({ me, partner });
  await reload(s);

  unsubscribe = useHome.subscribe((next, prev) => {
    if (hydrating || current !== s) return;
    const changes = diffSnapshots(pick(prev), pick(next), s.people, newId);
    if (changes) enqueue(s, () => save(s, changes));
    if (next.rules !== prev.rules || next.prefs !== prev.prefs) {
      const { rules, prefs } = next;
      enqueue(s, () => saveSettings(s, rules, prefs));
    }
  });
}

/** 로그아웃: 저장을 멈추고 스토어를 비운다 */
export function stopSync() {
  unsubscribe?.();
  unsubscribe = null;
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
