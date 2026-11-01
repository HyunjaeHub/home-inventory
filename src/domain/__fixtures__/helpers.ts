import { SEED_TODAY } from '../seed';
import type { Ctx, FoodItem, Item } from '../types';

export function makeCtx(overrides: Partial<Ctx> = {}): Ctx {
  let n = 0;
  return { today: SEED_TODAY, by: '나', newId: () => `new${++n}`, ...overrides };
}

export function food(items: Item[], id: string): FoodItem {
  const it = items.find((i) => i.id === id);
  if (!it || it.kind !== 'food') throw new Error(`food ${id} not found`);
  return it;
}
