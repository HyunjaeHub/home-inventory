import {
  amountText,
  daysBetween,
  dBadge,
  DEFAULT_RULES,
  expTone,
  foodSummary,
  lotAge,
  lotText,
  lotsOf,
  mealPool,
  totalText,
  type FoodItem,
  type IsoDate,
  type Item,
  type Lot,
  type MealEntry,
  type Place,
  type Rules,
  type Tone,
} from '@/domain';

export type MealRow = {
  id: string;
  itemId: string;
  name: string;
  checked: boolean;
  place: Place;
  /** 'D-2 · 재고 3팩 · 다른 묶음에서도 꺼내요' */
  rest: string;
  amount: string;
};

const expOrAge = (lot: Lot, today: IsoDate) =>
  lot.exp ? dBadge(daysBetween(today, lot.exp)) : `${lotAge(lot, today)}일째`;

/** 다음 한끼에 담긴 재료 줄 (다 먹어서 없어진 건 뺀다) */
export function mealRows(items: Item[], meal: MealEntry[], today: IsoDate): MealRow[] {
  return meal.flatMap((m) => {
    const r = mealPool(items, m, today);
    if (!r) return [];
    const q = Math.min(m.qty, r.max);
    const more = q > r.lot.qty;
    return [
      {
        id: m.id,
        itemId: m.itemId,
        name: r.item.name,
        checked: m.checked,
        place: r.lot.place,
        rest: `${expOrAge(r.lot, today)} · 재고 ${amountText(r.lot, r.max)}${more ? ' · 다른 묶음에서도 꺼내요' : ''}`,
        amount: amountText(r.lot, q),
      },
    ];
  });
}

export type MealSuggestion = {
  itemId: string;
  lotId: string;
  name: string;
  badge: string;
  tone: Tone;
  place: Place;
  rest: string;
};

/** '먼저 먹으면 좋아요': 기한 임박이거나 오래 둔 식품 중 아직 안 담은 것 */
export function mealSuggestions(
  items: Item[],
  meal: MealEntry[],
  today: IsoDate,
  rules: Rules = DEFAULT_RULES
): MealSuggestion[] {
  const out: (MealSuggestion & { key: number })[] = [];
  for (const it of items) {
    if (it.kind !== 'food' || meal.some((m) => m.itemId === it.id)) continue;
    const sm = foodSummary(it, today, undefined, rules);
    if (!sm.first) continue;
    const urgent = sm.first.exp
      ? (sm.days ?? Infinity) <= rules.urgentDays
      : lotAge(sm.first, today) >= rules.oldDays;
    if (!urgent) continue;
    out.push({
      key: sm.days ?? 5,
      itemId: it.id,
      lotId: sm.first.id,
      name: it.name,
      badge: sm.badge,
      tone: sm.tone,
      place: sm.first.place,
      rest: lotText(sm.first),
    });
  }
  return out.sort((a, b) => a.key - b.key).map(({ key: _key, ...s }) => s);
}

export type PickerItem = {
  itemId: string;
  lotId: string;
  name: string;
  badge: string;
  tone: Tone;
  qty: string;
  inMeal: boolean;
};

/** 재료 고르기: 냉장·냉동·실온별 식품 (검색어로 거름, 급한 순) */
export function pickerGroups(
  items: Item[],
  meal: MealEntry[],
  today: IsoDate,
  query: string
): { place: Place; items: PickerItem[] }[] {
  const q = query.trim();
  const foods = items.filter((i): i is FoodItem => i.kind === 'food');
  return (['냉장', '냉동', '실온'] as Place[])
    .map((place) => {
      const rows = foods
        .filter((it) => lotsOf(it, today, place).length && (!q || it.name.includes(q)))
        .map((it) => {
          const ls = lotsOf(it, today, place);
          const l = ls[0];
          const d = l.exp ? daysBetween(today, l.exp) : null;
          return {
            key: d ?? 999 - lotAge(l, today),
            itemId: it.id,
            lotId: l.id,
            name: it.name,
            badge: d !== null ? dBadge(d) : `${lotAge(l, today)}일`,
            tone: d !== null ? expTone(d) : ('gray' as Tone),
            qty: totalText(ls),
            inMeal: meal.some((m) => m.itemId === it.id),
          };
        })
        .sort((a, b) => a.key - b.key)
        .map(({ key: _key, ...r }) => r);
      return { place, items: rows };
    })
    .filter((g) => g.items.length > 0);
}
