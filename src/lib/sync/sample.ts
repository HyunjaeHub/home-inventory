import {
  addDays,
  daysBetween,
  DEFAULT_PLACES,
  firstOfKind,
  kindOf,
  SEED_TODAY,
  seedData,
  type IsoDate,
  type Item,
  type StoragePlace,
} from '@/domain';

import type { Snapshot } from './rows';

/**
 * 시안 샘플 데이터를 우리 집에 맞게 바꾼다 (개발용 "샘플 데이터 채우기").
 * - id는 새로 만들고 (서버는 uuid), 장소는 같은 종류의 첫 장소로
 * - 날짜는 오늘 기준으로 옮기고, '나'·'남편'은 구성원 이름으로
 */
export function sampleFor(
  places: StoragePlace[],
  names: { me: string; other: string | null },
  today: IsoDate,
  newId: () => string
): Omit<Snapshot, 'places'> {
  const seed = seedData();
  const shift = daysBetween(SEED_TODAY, today);
  const date = (d: IsoDate) => addDays(d, shift);
  const place = (p: string) => firstOfKind(places, kindOf(DEFAULT_PLACES, p));
  const by = (n: string) => (n === '나' ? names.me : (names.other ?? names.me));

  const ids = new Map<string, string>();
  const id = (old: string) => {
    if (!ids.has(old)) ids.set(old, newId());
    return ids.get(old)!;
  };

  const items: Item[] = seed.items.map((it) => {
    const log = it.log.map((g) => ({ ...g, by: by(g.by), date: date(g.date) }));
    if (it.kind === 'cons') return { ...it, id: id(it.id), place: place(it.place), log };
    return {
      ...it,
      id: id(it.id),
      place: place(it.place),
      log,
      lots: it.lots.map((l) => ({
        ...l,
        id: id(l.id),
        place: place(l.place),
        exp: l.exp ? date(l.exp) : null,
        bought: date(l.bought),
        by: by(l.by),
      })),
    };
  });

  return {
    items,
    shop: seed.shop.map((x) => ({ ...x, id: id(x.id), place: place(x.place), by: by(x.by) })),
    inbox: seed.inbox.map((x) => ({
      ...x,
      id: id(x.id),
      place: place(x.place),
      by: by(x.by),
      date: date(x.date),
    })),
    meal: [],
    tasks: seed.tasks.map((t) => ({ ...t, id: id(t.id) })),
  };
}
