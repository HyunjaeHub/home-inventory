import { ageTone, consDays, foodSummary, lotAge, type FoodSummary } from './badges';
import { daysBetween } from './date';
import { lotsOf } from './lots';
import { inShop } from './shopping';
import {
  DEFAULT_RULES,
  type ConsumableItem,
  type FoodItem,
  type IsoDate,
  type Item,
  type Lot,
  type Rules,
  type ShopItem,
  type Tone,
} from './types';

const foods = (items: Item[]) => items.filter((i): i is FoodItem => i.kind === 'food');
const consumables = (items: Item[]) => items.filter((i): i is ConsumableItem => i.kind === 'cons');

/** 기한이 urgentDays 이하로 남은 식품 (가까운 순) */
export function expiringSoon(
  items: Item[],
  today: IsoDate,
  rules: Rules = DEFAULT_RULES
): { item: FoodItem; summary: FoodSummary & { first: Lot; days: number } }[] {
  return foods(items)
    .map((item) => ({ item, summary: foodSummary(item, today, undefined, rules) }))
    .filter(
      (x): x is { item: FoodItem; summary: FoodSummary & { first: Lot; days: number } } =>
        x.summary.first?.exp != null && x.summary.days != null && x.summary.days <= rules.urgentDays
    )
    .sort((a, b) => a.summary.days - b.summary.days);
}

/** 기한 없이 관리하는데 산 지 oldDays 이상 된 식품 (오래된 순) */
export function oldFoods(
  items: Item[],
  today: IsoDate,
  rules: Rules = DEFAULT_RULES
): { item: FoodItem; lot: Lot; age: number; tone: Tone }[] {
  const out: { item: FoodItem; lot: Lot; age: number; tone: Tone }[] = [];
  for (const item of foods(items)) {
    const lot = lotsOf(item, today)
      .filter((l) => !l.exp && lotAge(l, today) >= rules.oldDays)
      .sort((a, b) => daysBetween(b.bought, a.bought))[0];
    if (!lot) continue;
    const age = lotAge(lot, today);
    out.push({ item, lot, age, tone: ageTone(age, rules) });
  }
  return out.sort((a, b) => b.age - a.age);
}

/** consSoonDays 안에 떨어질 소모품 (빨리 떨어지는 순) */
export function runningOut(items: Item[], rules: Rules = DEFAULT_RULES): ConsumableItem[] {
  return consumables(items)
    .filter((it) => consDays(it) <= rules.consSoonDays)
    .sort((a, b) => consDays(a) - consDays(b));
}

/** 다 썼는데 아직 살 것에 없는 소모품 */
export function usedUpNotInShop(items: Item[], shop: ShopItem[]): ConsumableItem[] {
  return consumables(items).filter((it) => it.qty <= 0 && !inShop(shop, it.name));
}

/** 기한 지난 로트 수 */
export function expiredLotCount(items: Item[], today: IsoDate): number {
  let n = 0;
  for (const item of foods(items)) {
    for (const l of lotsOf(item, today)) if (l.exp && daysBetween(today, l.exp) < 0) n++;
  }
  return n;
}
