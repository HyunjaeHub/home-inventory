import { DEFAULT_PLACES, eat, SEED_TODAY, seedData, type Item } from '@/domain';
import {
  diffSnapshots,
  fromRows,
  TABLES,
  type People,
  type ServerRows,
  type Snapshot,
} from '../rows';
import { sampleFor } from '../sample';

const people: People = {
  householdId: 'hh',
  idOf: (n) => ({ 나: 'u-me', 남편: 'u-other' })[n] ?? null,
  nameOf: (id) => ({ 'u-me': '나', 'u-other': '남편' })[id ?? ''] ?? '알 수 없음',
};

let seq = 0;
const newId = () => `new-${++seq}`;

function snapshot(): Snapshot {
  return { places: DEFAULT_PLACES, meal: [], ...seedData() };
}

/** diff 결과를 서버에 그대로 적용한 것처럼 행을 만든다 */
function serverRowsOf(s: Snapshot): ServerRows {
  const empty: Snapshot = { places: [], items: [], shop: [], inbox: [], meal: [], tasks: [] };
  const c = diffSnapshots(empty, s, people, newId, new Date('2026-10-23T00:00:00Z'))!;
  const rows = Object.fromEntries(TABLES.map((t) => [t, c.upsert[t] ?? []])) as ServerRows;
  rows.item_logs = [...rows.item_logs].sort((a, b) =>
    String(b.created_at).localeCompare(String(a.created_at))
  );
  return rows;
}

describe('diffSnapshots', () => {
  it('바뀐 게 없으면 null', () => {
    const s = snapshot();
    expect(diffSnapshots(s, s, people, newId)).toBeNull();
  });

  it('먹음: 로트 수정과 새 기록만 보낸다', () => {
    const s = snapshot();
    const r = eat(s.items, 'egg', null, { today: SEED_TODAY, by: '나', newId })!;
    const c = diffSnapshots(s, { ...s, items: r.next }, people, newId)!;
    expect(Object.keys(c.upsert).sort()).toEqual(['item_logs', 'lots']);
    expect(c.upsert.lots).toHaveLength(1);
    expect(c.upsert.lots![0]).toMatchObject({ item_id: 'egg', qty: 9, bought_by: 'u-me' });
    expect(c.upsert.item_logs![0]).toMatchObject({ item_id: 'egg', actor: 'u-me' });
    expect(c.delete).toEqual({});
  });

  it('지운 행과 장소 순서 변경', () => {
    const s = snapshot();
    const next = {
      ...s,
      tasks: s.tasks.slice(1),
      places: [s.places[1], s.places[0], ...s.places.slice(2)],
    };
    const c = diffSnapshots(s, next, people, newId)!;
    expect(c.delete.tasks).toEqual(['t1']);
    expect(c.upsert.places!.map((p) => [p.id, p.sort_order])).toEqual([
      ['냉동', 0],
      ['냉장', 1],
    ]);
  });
});

describe('fromRows', () => {
  it('행으로 저장했다가 읽으면 같은 데이터', () => {
    const s = snapshot();
    expect(fromRows(serverRowsOf(s), people)).toEqual(s);
  });
});

describe('sampleFor', () => {
  it('새 id, 우리 집 장소, 오늘 기준 날짜, 구성원 이름', () => {
    const places = [
      { id: 'p-fridge', name: '양문형', kind: 'fridge' as const },
      { id: 'p-freezer', name: '냉동', kind: 'freezer' as const },
      { id: 'p-pantry', name: '실온', kind: 'pantry' as const },
      { id: 'p-home', name: '생활', kind: 'home' as const },
    ];
    const s = sampleFor(places, { me: '지원', other: null }, '2026-10-25', newId);
    const egg = s.items.find((i) => i.name === '계란') as Extract<Item, { kind: 'food' }>;
    expect(egg.id).toMatch(/^new-/);
    expect(egg.place).toBe('p-fridge');
    expect(egg.lots[0]).toMatchObject({ exp: '2026-11-06', bought: '2026-10-22', by: '지원' });
    // 상대가 없으면 남편 기록도 나로
    expect(s.shop.every((x) => x.by === '지원')).toBe(true);
  });
});
