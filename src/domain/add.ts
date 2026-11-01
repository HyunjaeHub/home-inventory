import { addDays, daysBetween } from './date';
import { cloneItems, findByName, fmt } from './lots';
import {
  DEFAULT_RULES,
  type Change,
  type Ctx,
  type InboxItem,
  type IsoDate,
  type Item,
  type Place,
} from './types';

/** 품목 이름으로 단위 추정. 모르면 null */
export function unitGuess(name: string): string | null {
  const n = name.trim();
  const dict: [RegExp, string][] = [
    [
      /(삼겹|목살|항정|갈비|차돌|안심|등심|다짐육|불고기|닭다리|닭가슴|닭봉|소고기|돼지고기|고기|연어|오징어|새우)/,
      'g',
    ],
    [/(대파|쪽파|시금치|부추|미나리|깻잎|열무)/, '단'],
    [/(만두|라면|시리얼|과자|떡|국수|소면|파스타)/, '봉'],
    [/(휴지|키친타월|두루마리)/, '롤'],
    [/(세제|샴푸|린스|바디워시|섬유유연제|주방세제)/, '통'],
    [/(낫또|두부팩|김)/, '팩'],
    [
      /(우유|두부|계란|달걀|요거트|양파|감자|고구마|당근|사과|배|오이|애호박|버섯|토마토|칫솔|수세미|면도기날|쓰레기봉투)/,
      '개',
    ],
  ];
  for (const [re, unit] of dict) if (re.test(n)) return unit;
  return null;
}

/** 기한을 따로 안 정했을 때 보관 장소별 기본 기한(일) */
export function defaultExpDays(place: Place): number {
  if (place === '냉동') return 60;
  if (place === '실온') return 30;
  return 7;
}

/** 빠른 추가 폼에 미리 채울 값 */
export type AddPrefill = {
  kind: 'food' | 'cons';
  place: Place;
  unit: string;
  qty: number;
  split: boolean;
  /** 기한 일수. 'none'이면 기한 없음 */
  exp?: string;
  /** 단위를 어디서 알아냈는지: 예전 기록 / 사전 / 새 품목 */
  source: 'hist' | 'dict' | 'new';
};

/**
 * 이름으로 빠른 추가 폼을 미리 채운다. 예전에 넣은 적 있으면 그 설정을, 없으면 단위 사전으로 추정.
 * hintPlace: 장보기에서 넘어온 경우 담을 때 고른 장소
 */
export function prefillFor(items: Item[], name: string, hintPlace: Place = '냉장'): AddPrefill {
  const ex = findByName(items, name);
  if (ex?.kind === 'cons') {
    return {
      kind: 'cons',
      place: '생활',
      unit: ex.unit || '개',
      qty: 1,
      split: false,
      source: 'hist',
    };
  }
  if (ex?.kind === 'food') {
    const bulk = ex.unit === 'g' || ex.unit === 'ml';
    return {
      kind: 'food',
      place: ex.place,
      unit: ex.unit || '개',
      qty: bulk ? 600 : 1,
      split: bulk,
      exp: ex.noExp ? 'none' : '7',
      source: 'hist',
    };
  }
  const g = unitGuess(name);
  const source = g ? 'dict' : 'new';
  if (hintPlace === '생활' || g === '롤' || g === '통') {
    return { kind: 'cons', place: '생활', unit: g || '개', qty: 1, split: false, source };
  }
  return {
    kind: 'food',
    place: hintPlace,
    unit: g || '개',
    qty: g === 'g' ? 600 : 1,
    split: g === 'g',
    exp: hintPlace === '실온' ? 'none' : '7',
    source,
  };
}

export type AddInput = {
  name: string;
  kind: 'food' | 'cons';
  place: Place;
  unit: string;
  qty: number;
  /** 기한. null이면 기한 없음 */
  exp: IsoDate | null;
  /** 소분해서 넣기: portions팩으로 나누고, 냉동이면 그중 fridge팩은 바로 냉장에 */
  split?: { portions: number; fridge: number };
};

/** 빠른 추가로 재고에 넣기. 같은 이름 품목이 있으면 거기에 로트를 더한다 */
export function addStock(
  items: Item[],
  input: AddInput,
  ctx: Ctx
): { next: Item[]; message: string; itemId: string } | null {
  const name = input.name.trim();
  if (!name || !(input.qty > 0)) return null;
  const rules = ctx.rules ?? DEFAULT_RULES;
  const next = cloneItems(items);
  let it = findByName(next, name);
  if (!it) {
    it =
      input.kind === 'cons'
        ? {
            id: ctx.newId(),
            name,
            kind: 'cons',
            place: '생활',
            unit: input.unit || '개',
            qty: 0,
            every: 14,
            log: [],
          }
        : {
            id: ctx.newId(),
            name,
            kind: 'food',
            place: input.place,
            unit: input.unit,
            noExp: false,
            lots: [],
            log: [],
          };
    next.push(it);
  }

  let message: string;
  if (it.kind === 'food') {
    it.unit = input.unit;
    it.noExp = input.exp === null;
    it.place = input.place;
    const base = { unit: input.unit, place: input.place, bought: ctx.today, by: ctx.by };
    if (input.split) {
      const portions = Math.max(2, Math.min(10, input.split.portions));
      const size = input.qty / portions;
      const fridge =
        input.place === '냉동' ? Math.max(0, Math.min(portions - 1, input.split.fridge)) : 0;
      if (fridge > 0) {
        const exp = input.exp
          ? addDays(ctx.today, Math.min(daysBetween(ctx.today, input.exp), rules.chillDays))
          : null;
        it.lots.push({ ...base, id: ctx.newId(), exp, qty: fridge, size, place: '냉장' });
      }
      it.lots.push({ ...base, id: ctx.newId(), exp: input.exp, qty: portions - fridge, size });
      it.log.unshift({
        text: `${fmt(input.qty)}${input.unit} 사서 ${portions}팩으로 나눔`,
        by: ctx.by,
        date: ctx.today,
      });
      message = `${name} ${portions}팩으로 나눠 넣었어요`;
    } else {
      it.lots.push({ ...base, id: ctx.newId(), exp: input.exp, qty: input.qty, size: null });
      it.log.unshift({ text: `${fmt(input.qty)}${input.unit} 넣음`, by: ctx.by, date: ctx.today });
      message = `${name} ${fmt(input.qty)}${input.unit} 넣었어요`;
    }
  } else {
    it.unit = input.unit || it.unit || '개';
    it.qty += input.qty;
    it.log.unshift({ text: `${input.qty}${it.unit} 구매`, by: ctx.by, date: ctx.today });
    message = `${name} ${input.qty}${it.unit} 넣었어요`;
  }
  return { next, message, itemId: it.id };
}

/**
 * 정리할 것 1개를 묻지 않고 바로 재고에 넣기 (예전 설정 또는 장소별 기본값).
 * 덩어리(g/ml) 품목은 1팩으로, 소모품은 1개로 넣는다.
 */
export function storeInboxItem(items: Item[], entry: InboxItem, ctx: Ctx): Change<Item[]> {
  const next = cloneItems(items);
  let it = findByName(next, entry.name);
  const today = ctx.today;

  if (it?.kind === 'cons' || (!it && entry.place === '생활')) {
    if (!it) {
      it = {
        id: ctx.newId(),
        name: entry.name,
        kind: 'cons',
        place: '생활',
        unit: '개',
        qty: 0,
        every: 14,
        log: [],
      };
      next.push(it);
    }
    if (it.kind === 'cons') it.qty += 1;
    it.log.unshift({ text: '장보기로 1개 구매', by: entry.by, date: today });
    return { next, message: `${entry.name} 생활에 넣었어요` };
  }

  const bulk = it?.kind === 'food' && (it.unit === 'g' || it.unit === 'ml');
  const place = it ? it.place : entry.place;
  const unit = bulk ? '팩' : (it?.unit ?? '개');
  const noExp = it?.kind === 'food' ? it.noExp : place === '실온';
  if (!it) {
    it = { id: ctx.newId(), name: entry.name, kind: 'food', place, unit, noExp, lots: [], log: [] };
    next.push(it);
  }
  if (it.kind === 'food') {
    it.lots.push({
      id: ctx.newId(),
      exp: noExp ? null : addDays(today, defaultExpDays(place)),
      qty: 1,
      unit,
      size: null,
      place,
      bought: today,
      by: entry.by,
    });
  }
  it.log.unshift({ text: `장보기로 1${unit} 넣음`, by: entry.by, date: today });
  return { next, message: `${entry.name} ${place}에 넣었어요` };
}
