import { daysBetween } from './date';
import type { FoodItem, IsoDate, Item, Lot, Place } from './types';

/** 소수 첫째 자리까지 */
export function fmt(n: number): string {
  return String(Math.round(n * 10) / 10);
}

/** 소분하지 않은 g/ml 덩어리: 먹을 때 통째로 줄어든다 */
export function isBulk(lot: Lot): boolean {
  return !lot.size && (lot.unit === 'g' || lot.unit === 'ml');
}

export function unitLabel(lot: Lot): string {
  return lot.size ? '팩' : lot.unit;
}

/** '200g × 2팩' 또는 '3개' */
export function lotText(lot: Lot): string {
  return lot.size ? `${fmt(lot.size)}${lot.unit} × ${lot.qty}팩` : `${lot.qty}${lot.unit}`;
}

/** 한 번 먹을 때의 양 */
export function oneText(lot: Lot): string {
  return isBulk(lot) ? lotText(lot) : `1${unitLabel(lot)}`;
}

/** 여러 로트를 단위별로 합쳐 '200g × 3팩 · 2개' */
export function totalText(lots: Lot[]): string {
  if (!lots.length) return '0';
  const order: string[] = [];
  const sum: Record<string, number> = {};
  for (const l of lots) {
    const key = l.size ? `${fmt(l.size)}${l.unit} × |팩` : `|${l.unit}`;
    if (!(key in sum)) {
      sum[key] = 0;
      order.push(key);
    }
    sum[key] += l.qty;
  }
  return order
    .map((key) => {
      const [before, after] = key.split('|');
      return `${before}${fmt(sum[key])}${after}`;
    })
    .join(' · ');
}

/** 남은 로트를 기한 가까운 순(같으면 먼저 산 순)으로. 기한 없는 것은 뒤로 */
export function lotsOf(item: FoodItem, today: IsoDate, place?: Place): Lot[] {
  const expKey = (l: Lot) => (l.exp ? daysBetween(today, l.exp) : Number.MAX_SAFE_INTEGER);
  return item.lots
    .filter((l) => l.qty > 0 && (!place || l.place === place))
    .sort((a, b) => expKey(a) - expKey(b) || daysBetween(b.bought, a.bought));
}

export function findItem(items: Item[], id: string): Item | undefined {
  return items.find((i) => i.id === id);
}

export function findFood(items: Item[], id: string): FoodItem | undefined {
  const it = findItem(items, id);
  return it?.kind === 'food' ? it : undefined;
}

export function findByName(items: Item[], name: string): Item | undefined {
  return items.find((i) => i.name === name);
}

/** 변경 연산용 깊은 복사 (데이터는 순수 JSON) */
export function cloneItems(items: Item[]): Item[] {
  return JSON.parse(JSON.stringify(items));
}

/** 부분만 남은 소분 팩을 별도 팩으로 떼어낸다: 200g × 1.5팩 → 200g × 1팩 + 100g × 1팩 */
export function splitPartialPack(item: FoodItem, lot: Lot, newId: () => string): void {
  if (!lot.size || lot.qty <= 0 || lot.qty % 1 === 0) return;
  const whole = Math.floor(lot.qty);
  const part = lot.qty - whole;
  if (whole > 0) {
    lot.qty = whole;
    item.lots.push({ ...lot, id: newId(), qty: 1, size: lot.size * part });
  } else {
    lot.size = lot.size * part;
    lot.qty = 1;
  }
}

/** 다 쓴 로트 정리 */
export function dropEmptyLots(item: FoodItem): void {
  item.lots = item.lots.filter((l) => l.qty > 0);
}
