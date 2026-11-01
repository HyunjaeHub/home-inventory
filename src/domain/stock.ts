import { addDays, daysBetween, monthDay } from './date';
import {
  cloneItems,
  dropEmptyLots,
  findItem,
  fmt,
  isBulk,
  lotText,
  lotsOf,
  oneText,
  splitPartialPack,
  totalText,
  unitLabel,
} from './lots';
import {
  DEFAULT_RULES,
  type Change,
  type Ctx,
  type FoodItem,
  type IsoDate,
  type Item,
  type Lot,
  type Place,
  type Rules,
} from './types';

function log(item: Item, text: string, ctx: Ctx): void {
  item.log.unshift({ text, by: ctx.by, date: ctx.today });
}

function foodIn(items: Item[], id: string): FoodItem | undefined {
  const it = findItem(items, id);
  return it?.kind === 'food' ? it : undefined;
}

/**
 * 보관 장소를 옮길 때 기한 조정.
 * 냉동 → 냉장/실온: 해동했으니 chillDays 안에 먹기. 냉장/실온 → 냉동: 최소 freezeMinDays 보장.
 */
export function adjustExp(
  exp: IsoDate | null,
  from: Place,
  to: Place,
  today: IsoDate,
  rules: Rules = DEFAULT_RULES
): IsoDate | null {
  if (from === '냉동' && to !== '냉동') {
    const left = exp ? daysBetween(today, exp) : rules.chillDays;
    return addDays(today, Math.min(left, rules.chillDays));
  }
  if (to === '냉동' && exp) {
    return addDays(today, Math.max(daysBetween(today, exp), rules.freezeMinDays));
  }
  return exp;
}

/** 한 번 먹기: 덩어리(g/ml)는 로트 전체, 그 외는 1개(1팩). lotId가 없으면 기한 가장 가까운 로트 */
export function eat(items: Item[], itemId: string, lotId: string | null, ctx: Ctx): Change<Item[]> {
  const next = cloneItems(items);
  const it = foodIn(next, itemId);
  if (!it) return null;
  const lots = lotsOf(it, ctx.today);
  const lot = lotId ? lots.find((l) => l.id === lotId) : lots[0];
  if (!lot) return null;

  let text: string;
  if (isBulk(lot)) {
    text = `${lotText(lot)} 다 먹음`;
    lot.qty = 0;
  } else {
    text = `1${unitLabel(lot)} 먹음`;
    lot.qty -= 1;
  }
  dropEmptyLots(it);
  log(it, text, ctx);

  const left = lotsOf(it, ctx.today);
  return {
    next,
    message: `${it.name} ${text} · ${left.length ? `${totalText(left)} 남음` : '다 먹었어요'}`,
  };
}

/** 냉동 ↔ 냉장 옮기기. 여러 개짜리 로트면 1개(1팩)만 떼어서 옮긴다 */
export function moveLot(items: Item[], itemId: string, lotId: string, ctx: Ctx): Change<Item[]> {
  const rules = ctx.rules ?? DEFAULT_RULES;
  const next = cloneItems(items);
  const it = foodIn(next, itemId);
  const lot = it?.lots.find((l) => l.id === lotId);
  if (!it || !lot) return null;

  const to: Place = lot.place === '냉동' ? '냉장' : '냉동';
  let moved: Lot = lot;
  if (!isBulk(lot) && lot.qty > 1) {
    lot.qty -= 1;
    moved = { ...lot, id: ctx.newId(), qty: 1 };
    it.lots.push(moved);
  }
  const from = moved.place;
  moved.place = to;
  moved.exp = adjustExp(moved.exp, from, to, ctx.today, rules);

  if (to === '냉장') {
    log(it, `${oneText(moved)} 해동`, ctx);
    return {
      next,
      message: `${it.name} ${oneText(moved)} 해동했어요 · ${monthDay(moved.exp!)}까지 먹기`,
    };
  }
  log(it, `${oneText(moved)} 냉동실로`, ctx);
  return { next, message: `${it.name} ${oneText(moved)} 냉동실로 옮겼어요` };
}

/** 소모품 1개 사용 */
export function useOne(items: Item[], itemId: string, ctx: Ctx): Change<Item[]> {
  const next = cloneItems(items);
  const it = findItem(next, itemId);
  if (!it || it.kind !== 'cons' || it.qty <= 0) return null;
  it.qty -= 1;
  log(it, '1개 사용', ctx);
  return { next, message: `${it.name} 1개 썼어요 · ${it.qty}${it.unit} 남음` };
}

/** 소모품 1개 구매 */
export function buyOne(items: Item[], itemId: string, ctx: Ctx): Change<Item[]> {
  const next = cloneItems(items);
  const it = findItem(next, itemId);
  if (!it || it.kind !== 'cons') return null;
  it.qty += 1;
  log(it, '1개 구매', ctx);
  return { next, message: `${it.name} 1개 넣었어요` };
}

/** 남은 양 고치기. 소분 팩이 1.5팩처럼 남으면 부분 팩을 따로 떼어낸다 */
export function setLotQty(
  items: Item[],
  itemId: string,
  lotId: string,
  value: number,
  ctx: Ctx
): Change<Item[]> {
  const next = cloneItems(items);
  const it = foodIn(next, itemId);
  const lot = it?.lots.find((l) => l.id === lotId);
  if (!it || !lot) return null;

  const before = lotText(lot);
  lot.qty = Math.max(0, Math.round(value * 10) / 10);
  splitPartialPack(it, lot, ctx.newId);
  dropEmptyLots(it);

  const after =
    lot.qty > 0
      ? totalText(
          lotsOf(it, ctx.today).filter((l) => l.place === lot.place && l.bought === lot.bought)
        )
      : '0';
  log(it, `양 고침 ${before} → ${after}`, ctx);
  return {
    next,
    message: `${it.name} ${lot.qty > 0 ? `남은 양을 고쳤어요 · ${after}` : '다 쓴 걸로 정리했어요'}`,
  };
}

/**
 * 로트를 portions팩으로 나누기. other팩은 otherPlace로 보낸다 (기한도 장소에 맞게 조정).
 * 예: 닭다리살 600g → 200g × 3팩, 그중 1팩은 냉장
 */
export function splitLot(
  items: Item[],
  itemId: string,
  lotId: string,
  portions: number,
  other: number,
  otherPlace: Place,
  ctx: Ctx
): Change<Item[]> {
  const next = cloneItems(items);
  const it = foodIn(next, itemId);
  const lot = it?.lots.find((l) => l.id === lotId);
  if (!it || !lot) return null;

  const p = Math.max(2, Math.min(10, portions));
  const o = Math.max(0, Math.min(p - 1, other));
  const total = lot.size ? lot.size * lot.qty : lot.qty;
  const size = total / p;
  const before = lotText(lot);

  it.lots = it.lots.filter((l) => l.id !== lot.id);
  it.lots.push({ ...lot, id: ctx.newId(), qty: p - o, size });
  if (o > 0) {
    it.lots.push({
      ...lot,
      id: ctx.newId(),
      qty: o,
      size,
      place: otherPlace,
      exp: adjustExp(lot.exp, lot.place, otherPlace, ctx.today, ctx.rules),
    });
  }
  log(it, `${before} → ${fmt(size)}${lot.unit}씩 ${p}팩`, ctx);
  return {
    next,
    message: `${it.name} ${p}팩으로 나눴어요${o > 0 ? ` · ${otherPlace} ${o}팩` : ''}`,
  };
}
