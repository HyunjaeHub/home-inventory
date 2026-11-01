import {
  cloneItems,
  dropEmptyLots,
  findItem,
  fmt,
  isBulk,
  lotsOf,
  splitPartialPack,
  unitLabel,
} from './lots';
import type { Change, Ctx, FoodItem, IsoDate, Item, Lot, MealEntry } from './types';

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/** +/- 한 번에 바뀌는 양: 덩어리는 50, 단(대파 등)은 0.5, 그 외 1 */
export function mealStep(lot: Lot): number {
  if (isBulk(lot)) return 50;
  if (lot.unit === '단' && !lot.size) return 0.5;
  return 1;
}

export function amountText(lot: Lot, qty: number): string {
  return `${fmt(qty)}${unitLabel(lot)}`;
}

export type MealPool = {
  item: FoodItem;
  /** 먼저 꺼낼 로트 */
  lot: Lot;
  /** 같은 단위로 꺼낼 수 있는 로트들 (primary 먼저) */
  pool: Lot[];
  /** 담을 수 있는 최대 양 */
  max: number;
};

/** 한끼 항목이 꺼낼 수 있는 로트 묶음. 품목이 없어졌거나 다 먹었으면 null */
export function mealPool(items: Item[], entry: MealEntry, today: IsoDate): MealPool | null {
  const it = findItem(items, entry.itemId);
  if (!it || it.kind !== 'food') return null;
  const lots = lotsOf(it, today);
  const primary =
    lots.find((l) => l.id === entry.lotId) ??
    lots.find((l) => unitLabel(l) === entry.label) ??
    lots[0];
  if (!primary) return null;
  const key = unitLabel(primary);
  const pool = [primary, ...lots.filter((l) => l !== primary && unitLabel(l) === key)];
  const max = round3(pool.reduce((s, l) => s + l.qty, 0));
  return { item: it, lot: primary, pool, max };
}

/** 다음 한끼에 담기 (품목당 한 줄) */
export function addMeal(
  meal: MealEntry[],
  items: Item[],
  itemId: string,
  lotId: string | null,
  ctx: Ctx
): Change<MealEntry[]> {
  const it = findItem(items, itemId);
  if (!it || it.kind !== 'food') return null;
  if (meal.some((m) => m.itemId === itemId)) {
    return { next: meal, message: `${it.name}은(는) 이미 다음 한끼에 있어요` };
  }
  const lot = lotId ? it.lots.find((l) => l.id === lotId) : lotsOf(it, ctx.today)[0];
  if (!lot) return null;
  const qty = Math.min(lot.qty, isBulk(lot) ? 100 : 1);
  return {
    next: [
      ...meal,
      { id: ctx.newId(), itemId, lotId: lot.id, label: unitLabel(lot), qty, checked: false },
    ],
    message: `${it.name} ${amountText(lot, qty)} 다음 한끼에 담았어요`,
  };
}

/** 양 늘리기(dir=1)/줄이기(dir=-1). 재고보다 많이 담으면 최대치로 맞추고 알려준다 */
export function changeMeal(
  meal: MealEntry[],
  items: Item[],
  id: string,
  dir: 1 | -1,
  today: IsoDate
): { next: MealEntry[]; message: string | null } {
  let message: string | null = null;
  const next = meal.map((m) => {
    if (m.id !== id) return m;
    const r = mealPool(items, m, today);
    if (!r) return m;
    const step = mealStep(r.lot);
    let q = Math.round((m.qty + dir * step) * 10) / 10;
    if (dir > 0 && q > r.max) {
      message = `재고에 있는 ${amountText(r.lot, r.max)}까지 담을 수 있어요`;
      q = r.max;
    }
    return { ...m, qty: Math.max(Math.min(step, r.max), q) };
  });
  return { next, message };
}

export function toggleMeal(meal: MealEntry[], id: string): MealEntry[] {
  return meal.map((m) => (m.id === id ? { ...m, checked: !m.checked } : m));
}

export function removeMeal(meal: MealEntry[], id: string): MealEntry[] {
  return meal.filter((m) => m.id !== id);
}

/** 한끼 완료: 체크한 항목만큼 재고에서 뺀다 (기한 가까운 로트부터) */
export function completeMeal(
  items: Item[],
  meal: MealEntry[],
  ctx: Ctx
): Change<{ items: Item[]; meal: MealEntry[] }> {
  const done = meal.filter((m) => m.checked);
  if (!done.length) return null;
  const next = cloneItems(items);
  let count = 0;

  for (const m of done) {
    const r = mealPool(next, m, ctx.today);
    if (!r) continue;
    let need = Math.min(m.qty, r.max);
    const text = amountText(r.lot, need);
    for (const lot of r.pool) {
      if (need <= 0) break;
      const take = Math.min(need, lot.qty);
      lot.qty = round3(lot.qty - take);
      need = round3(need - take);
      splitPartialPack(r.item, lot, ctx.newId);
    }
    dropEmptyLots(r.item);
    r.item.log.unshift({ text: `다음 한끼로 ${text} 먹음`, by: ctx.by, date: ctx.today });
    count++;
  }

  return {
    next: { items: next, meal: meal.filter((m) => !m.checked) },
    message: `해치웠어요! ${count}가지를 재고에서 뺐어요`,
  };
}
