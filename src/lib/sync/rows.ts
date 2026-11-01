import type { InboxItem, Item, LogEntry, MealEntry, ShopItem, StoragePlace, Task } from '@/domain';

/** 서버에 저장하는 우리 집 데이터 (설정 제외) */
export type Snapshot = {
  places: StoragePlace[];
  items: Item[];
  shop: ShopItem[];
  inbox: InboxItem[];
  meal: MealEntry[];
  tasks: Task[];
};

/**
 * 도메인은 "누가"를 이름 글자로 다루고 DB는 사용자 id로 저장한다.
 * 읽을 때 id → 이름, 쓸 때 이름 → id로 바꾼다.
 */
export type People = {
  householdId: string;
  idOf: (name: string) => string | null;
  nameOf: (userId: string | null) => string;
};

export type Row = { id: string } & Record<string, unknown>;

export const TABLES = [
  'places',
  'items',
  'lots',
  'item_logs',
  'shop_items',
  'inbox_items',
  'meal_entries',
  'tasks',
] as const;
export type TableName = (typeof TABLES)[number];

/** 비교해서 바꿀 수 있는 테이블 (기록은 추가만 하므로 따로) */
type DiffTable = Exclude<TableName, 'item_logs'>;
type Tables = Record<DiffTable, Row[]>;

export type Changes = {
  upsert: Partial<Record<TableName, Row[]>>;
  delete: Partial<Record<TableName, string[]>>;
};

// ───────────────────────── 도메인 → 행 ─────────────────────────

function toTables(s: Snapshot, people: People): Tables {
  const hh = people.householdId;
  const lots: Row[] = [];
  for (const it of s.items) {
    if (it.kind !== 'food') continue;
    for (const l of it.lots) {
      lots.push({
        id: l.id,
        household_id: hh,
        item_id: it.id,
        place_id: l.place,
        qty: l.qty,
        unit: l.unit,
        size: l.size,
        exp: l.exp,
        bought_on: l.bought,
        bought_by: people.idOf(l.by),
      });
    }
  }
  return {
    places: s.places.map((p, i) => ({
      id: p.id,
      household_id: hh,
      name: p.name,
      kind: p.kind,
      sort_order: i,
    })),
    items: s.items.map((it) => ({
      id: it.id,
      household_id: hh,
      name: it.name,
      kind: it.kind,
      place_id: it.place,
      unit: it.unit,
      no_exp: it.kind === 'food' ? it.noExp : false,
      qty: it.kind === 'cons' ? it.qty : null,
      every_days: it.kind === 'cons' ? it.every : null,
    })),
    lots,
    shop_items: s.shop.map((x) => ({
      id: x.id,
      household_id: hh,
      name: x.name,
      place_id: x.place,
      added_by: people.idOf(x.by),
      checked: x.checked,
    })),
    inbox_items: s.inbox.map((x) => ({
      id: x.id,
      household_id: hh,
      name: x.name,
      place_id: x.place,
      added_by: people.idOf(x.by),
      day: x.date,
    })),
    meal_entries: s.meal.map((m) => ({
      id: m.id,
      household_id: hh,
      item_id: m.itemId,
      lot_id: m.lotId,
      label: m.label,
      qty: m.qty,
      checked: m.checked,
    })),
    tasks: s.tasks.map((t) => ({ id: t.id, household_id: hh, text: t.text, done: t.done })),
  };
}

/** 바뀐 행만 고른다. 바뀐 게 없으면 null */
export function diffSnapshots(
  prev: Snapshot,
  next: Snapshot,
  people: People,
  newId: () => string,
  now: Date = new Date()
): Changes | null {
  const a = toTables(prev, people);
  const b = toTables(next, people);
  const changes: Changes = { upsert: {}, delete: {} };
  let any = false;

  for (const t of Object.keys(b) as DiffTable[]) {
    const before = new Map(a[t].map((r) => [r.id, JSON.stringify(r)]));
    const after = new Set(b[t].map((r) => r.id));
    const ups = b[t].filter((r) => before.get(r.id) !== JSON.stringify(r));
    const dels = a[t].filter((r) => !after.has(r.id)).map((r) => r.id);
    if (ups.length) changes.upsert[t] = ups;
    if (dels.length) changes.delete[t] = dels;
    any ||= ups.length > 0 || dels.length > 0;
  }

  // 기록은 앞에 쌓이기만 하므로, 늘어난 만큼이 새 기록이다
  const prevLogCount = new Map(prev.items.map((it) => [it.id, it.log.length]));
  const logs: Row[] = [];
  for (const it of next.items) {
    const added = it.log.length - (prevLogCount.get(it.id) ?? 0);
    it.log.slice(0, Math.max(0, added)).forEach((g, i) => {
      logs.push({
        id: newId(),
        household_id: people.householdId,
        item_id: it.id,
        text: g.text,
        actor: people.idOf(g.by),
        day: g.date,
        // 같은 변경에서 생긴 기록도 순서가 유지되게 앞의 것일수록 늦은 시각
        created_at: new Date(now.getTime() - i).toISOString(),
      });
    });
  }
  if (logs.length) {
    changes.upsert.item_logs = logs;
    any = true;
  }

  return any ? changes : null;
}

// ───────────────────────── 행 → 도메인 ─────────────────────────

/** 서버에서 읽은 행. 기록은 최신 순으로 정렬돼 있어야 한다 */
export type ServerRows = Record<TableName, Row[]>;

const num = (v: unknown) => (v == null ? null : Number(v));
const str = (v: unknown) => v as string;

export function fromRows(rows: ServerRows, people: People): Snapshot {
  const lotsByItem = new Map<string, Row[]>();
  for (const l of rows.lots) {
    const list = lotsByItem.get(str(l.item_id)) ?? [];
    list.push(l);
    lotsByItem.set(str(l.item_id), list);
  }
  const logsByItem = new Map<string, LogEntry[]>();
  for (const g of rows.item_logs) {
    const list = logsByItem.get(str(g.item_id)) ?? [];
    list.push({ text: str(g.text), by: people.nameOf(g.actor as string | null), date: str(g.day) });
    logsByItem.set(str(g.item_id), list);
  }

  const places = [...rows.places]
    .sort((x, y) => Number(x.sort_order) - Number(y.sort_order))
    .map((p) => ({ id: p.id, name: str(p.name), kind: p.kind as StoragePlace['kind'] }));

  const items: Item[] = rows.items.map((r) => {
    const base = {
      id: r.id,
      name: str(r.name),
      place: str(r.place_id),
      unit: str(r.unit),
      log: logsByItem.get(r.id) ?? [],
    };
    if (r.kind === 'cons') {
      return { ...base, kind: 'cons', qty: Number(r.qty), every: Number(r.every_days) };
    }
    return {
      ...base,
      kind: 'food',
      noExp: Boolean(r.no_exp),
      lots: (lotsByItem.get(r.id) ?? []).map((l) => ({
        id: l.id,
        exp: (l.exp as string | null) ?? null,
        qty: Number(l.qty),
        unit: str(l.unit),
        size: num(l.size),
        place: str(l.place_id),
        bought: str(l.bought_on),
        by: people.nameOf(l.bought_by as string | null),
      })),
    };
  });

  return {
    places,
    items,
    shop: rows.shop_items.map((x) => ({
      id: x.id,
      name: str(x.name),
      place: str(x.place_id),
      by: people.nameOf(x.added_by as string | null),
      checked: Boolean(x.checked),
    })),
    inbox: rows.inbox_items.map((x) => ({
      id: x.id,
      name: str(x.name),
      place: str(x.place_id),
      by: people.nameOf(x.added_by as string | null),
      date: str(x.day),
    })),
    meal: rows.meal_entries.map((m) => ({
      id: m.id,
      itemId: str(m.item_id),
      lotId: str(m.lot_id),
      label: str(m.label),
      qty: Number(m.qty),
      checked: Boolean(m.checked),
    })),
    tasks: rows.tasks.map((t) => ({ id: t.id, text: str(t.text), done: Boolean(t.done) })),
  };
}
