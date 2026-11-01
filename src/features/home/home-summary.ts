import {
  addDays,
  daysBetween,
  DEFAULT_RULES,
  expiredLotCount,
  lotsOf,
  mealPool,
  oldFoods,
  usedUpNotInShop,
  type FoodItem,
  type InboxItem,
  type IsoDate,
  type Item,
  type Lot,
  type MealEntry,
  type Rules,
  type ShopItem,
} from '@/domain';

export type StripEntry = { item: FoodItem; lot: Lot };

export type StripCol =
  { key: 'old'; entries: StripEntry[] } | { key: number; date: IsoDate; entries: StripEntry[] };

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function weekdayOf(iso: IsoDate): string {
  const [y, m, d] = iso.split('-').map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/**
 * 홈 '이번 주 기한' 띠: 맨 앞 '2주+'(기한 없이 오래 둔 것) + 오늘부터 7일.
 * 기한 지난 것은 오늘 칸에 모은다. 7일 뒤 기한인 품목 수는 laterCount로.
 */
export function expiryStrip(
  items: Item[],
  today: IsoDate,
  rules: Rules = DEFAULT_RULES
): { cols: StripCol[]; laterCount: number } {
  const foods = items.filter((i): i is FoodItem => i.kind === 'food');
  const days: StripEntry[][] = Array.from({ length: 7 }, () => []);
  const later = new Set<string>();
  for (const item of foods) {
    for (const lot of lotsOf(item, today)) {
      if (!lot.exp) continue;
      const d = Math.max(0, daysBetween(today, lot.exp));
      if (d > 6) later.add(item.id);
      else days[d].push({ item, lot });
    }
  }
  const old = oldFoods(items, today, rules).map(({ item, lot }) => ({ item, lot }));
  return {
    cols: [
      { key: 'old', entries: old },
      ...days.map((entries, i) => ({ key: i, date: addDays(today, i), entries })),
    ],
    laterCount: later.size,
  };
}

export type CheckLine = { text: string; detail: string; target: 'inbox' | 'stock' | 'shopping' };

/** 홈 '확인할 것': 정리할 것, 기한 지난 것, 오래 둔 재료, 다 쓴 생활용품 */
export function checkLines(
  items: Item[],
  shop: ShopItem[],
  inbox: InboxItem[],
  today: IsoDate,
  rules: Rules = DEFAULT_RULES
): CheckLine[] {
  const out: CheckLine[] = [];
  if (inbox.length) {
    out.push({
      text: '장본 것 정리',
      detail: inbox.map((x) => x.name).join(', '),
      target: 'inbox',
    });
  }
  const expired = expiredLotCount(items, today);
  if (expired) out.push({ text: '기한 지난 것', detail: `${expired}개`, target: 'stock' });
  const old = oldFoods(items, today, rules);
  if (old.length) {
    out.push({
      text: '오래 둔 재료',
      detail: old.map((o) => o.item.name).join(', '),
      target: 'stock',
    });
  }
  const used = usedUpNotInShop(items, shop);
  if (used.length) {
    out.push({
      text: '다 쓴 생활용품',
      detail: used.map((c) => c.name).join(', '),
      target: 'shopping',
    });
  }
  return out;
}

/** 다음 한끼에 담긴 품목 이름 (다 먹어서 없어진 건 뺀다) */
export function mealNames(items: Item[], meal: MealEntry[], today: IsoDate): string[] {
  return meal.flatMap((m) => {
    const r = mealPool(items, m, today);
    return r ? [r.item.name] : [];
  });
}
