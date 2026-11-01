import {
  addDays,
  DEFAULT_PLACES,
  findByName,
  firstOfKind,
  kindOf,
  prefillFor,
  unitGuess,
  type AddInput,
  type InboxItem,
  type IsoDate,
  type Item,
  type Place,
  type StoragePlace,
} from '@/domain';

export type ExpChoice = '3' | '7' | '14' | '30' | 'none' | 'pick';

export type AddForm = {
  name: string;
  kind: 'food' | 'cons';
  place: Place;
  unit: string;
  /** 넣을 양. 소분하면 전체 양 */
  qty: number;
  split: boolean;
  portions: number;
  /** 냉동 종류 소분일 때 냉장에 둘 팩 번호 */
  fridgePacks: number[];
  exp: ExpChoice;
  /** exp가 'pick'일 때 고른 날짜 */
  pick: IsoDate | null;
  /** 단위를 어디서 정했는지 (안내 문구용) */
  unitSrc: 'hist' | 'dict' | 'user' | 'new' | null;
};

export function blankForm(places: StoragePlace[] = DEFAULT_PLACES): AddForm {
  return {
    name: '',
    kind: 'food',
    place: firstOfKind(places, 'fridge'),
    unit: '개',
    qty: 1,
    split: false,
    portions: 3,
    fridgePacks: [],
    exp: '7',
    pick: null,
    unitSrc: null,
  };
}

export const EXP_CHOICES: [ExpChoice, string][] = [
  ['3', '+3일'],
  ['7', '+1주'],
  ['14', '+2주'],
  ['30', '+1달'],
  ['none', '기한 없음'],
];

export const isWeight = (unit: string) => unit === 'g' || unit === 'ml';

export function unitsFor(kind: AddForm['kind']): string[] {
  return kind === 'food' ? ['개', '단', '봉', '팩', 'g', 'ml'] : ['개', '롤', '통', '팩'];
}

/** 자주 넣는 양 바로가기 */
export function quickAmounts(form: AddForm): { qty: number; label: string }[] {
  const u = form.unit;
  const list =
    u === 'g'
      ? [300, 500, 600, 1000]
      : u === 'ml'
        ? [200, 500, 1000, 2000]
        : u === '단'
          ? [1, 2, 3]
          : u === '롤'
            ? [6, 12, 24, 30]
            : u === '개' && /(계란|달걀)/.test(form.name)
              ? [6, 10, 15, 30]
              : u === '개'
                ? [1, 2, 3, 5, 10]
                : [1, 2, 3, 4];
  return list.map((n) => ({
    qty: n,
    label: isWeight(u) && n >= 1000 ? `${n / 1000}${u === 'g' ? 'kg' : 'L'}` : `${n}${u}`,
  }));
}

export function qtyStep(form: AddForm): number {
  return form.kind === 'food' && isWeight(form.unit) ? 100 : 1;
}

/** 이름을 바꾸면: 예전에 넣은 품목은 그 설정을, 처음이면 단위 사전으로 채운다 (직접 고른 단위는 유지) */
export function withName(
  form: AddForm,
  items: Item[],
  name: string,
  places: StoragePlace[] = DEFAULT_PLACES
): AddForm {
  const trimmed = name.trim();
  if (findByName(items, trimmed)) {
    const p = prefillFor(items, trimmed, undefined, places);
    return {
      ...form,
      name,
      kind: p.kind,
      place: p.place,
      unit: p.unit,
      qty: p.qty,
      split: p.split,
      fridgePacks: [],
      exp: (p.exp as ExpChoice | undefined) ?? form.exp,
      unitSrc: 'hist',
    };
  }
  const g = unitGuess(name);
  if (g && form.unitSrc !== 'user') {
    const next: AddForm = { ...form, name, unit: g, unitSrc: 'dict', qty: g === 'g' ? 500 : 1 };
    if (g === '롤' || g === '통') {
      Object.assign(next, { kind: 'cons', place: firstOfKind(places, 'home'), split: false });
    } else if (form.kind === 'cons') {
      Object.assign(next, { kind: 'food', place: firstOfKind(places, 'fridge') });
    }
    if (g === 'g') next.split = true;
    return next;
  }
  return {
    ...form,
    name,
    unitSrc: form.unitSrc === 'user' ? 'user' : trimmed ? 'new' : form.unitSrc,
  };
}

/** 정리할 것에서 '정리'로 열 때: 예전 기록 → 사전 → 담을 때 고른 장소 순으로 채운다 */
export function fromInbox(
  items: Item[],
  entry: InboxItem,
  places: StoragePlace[] = DEFAULT_PLACES
): AddForm {
  const p = prefillFor(items, entry.name, entry.place, places);
  return {
    ...blankForm(places),
    name: entry.name,
    kind: p.kind,
    place: p.place,
    unit: p.unit,
    qty: p.qty,
    split: p.split,
    exp: (p.exp as ExpChoice | undefined) ?? '7',
    unitSrc: p.source,
  };
}

/** 식품 ↔ 소모품: 소모품은 생활용품 종류 장소로, 식품은 생활용품 종류가 아닌 곳으로 */
export function withKind(
  form: AddForm,
  kind: AddForm['kind'],
  places: StoragePlace[] = DEFAULT_PLACES
): AddForm {
  if (kind === 'cons') {
    return {
      ...form,
      kind,
      place: firstOfKind(places, 'home'),
      unit: '개',
      split: false,
      qty: Math.min(form.qty, 10),
    };
  }
  return {
    ...form,
    kind,
    place: kindOf(places, form.place) === 'home' ? firstOfKind(places, 'fridge') : form.place,
    unit: '개',
    qty: Math.min(form.qty, 10) || 1,
  };
}

export function withUnit(form: AddForm, unit: string): AddForm {
  const cur = form.qty;
  const qty = isWeight(unit) ? (cur < 50 ? 500 : cur) : cur >= 50 ? 1 : cur;
  return { ...form, unit, unitSrc: 'user', qty };
}

export function withPortions(form: AddForm, portions: number): AddForm {
  const p = Math.max(2, Math.min(10, portions));
  return { ...form, portions: p, fridgePacks: form.fridgePacks.filter((k) => k < p - 1) };
}

/** 팩마다 보관 장소: 냉동 종류면 고른 팩만 첫 냉장 장소로, 그 외는 모두 고른 장소 */
export function packPlaces(form: AddForm, places: StoragePlace[] = DEFAULT_PLACES): Place[] {
  const frozen = kindOf(places, form.place) === 'freezer';
  const fridge = firstOfKind(places, 'fridge');
  return Array.from({ length: form.portions }, (_, k) =>
    frozen && form.fridgePacks.includes(k) ? fridge : form.place
  );
}

/** 팩을 누르면 냉장 ↔ 냉동 (냉장·냉동 종류 장소일 때만) */
export function togglePack(
  form: AddForm,
  k: number,
  places: StoragePlace[] = DEFAULT_PLACES
): AddForm {
  const kind = kindOf(places, form.place);
  if (kind === 'fridge') {
    const all = Array.from({ length: form.portions }, (_, i) => i).filter((i) => i !== k);
    return { ...form, place: firstOfKind(places, 'freezer'), fridgePacks: all };
  }
  if (kind !== 'freezer') return form;
  const set = new Set(form.fridgePacks);
  if (set.has(k)) set.delete(k);
  else set.add(k);
  if (set.size >= form.portions) {
    return { ...form, place: firstOfKind(places, 'fridge'), fridgePacks: [] };
  }
  return { ...form, fridgePacks: [...set].sort((a, b) => a - b) };
}

/** 냉장에 둘 팩 수 (냉동 종류 소분일 때만) */
export function fridgeCount(form: AddForm, places: StoragePlace[] = DEFAULT_PLACES): number {
  return kindOf(places, form.place) === 'freezer' ? form.fridgePacks.length : 0;
}

export function formExp(form: AddForm, today: IsoDate): IsoDate | null {
  if (form.exp === 'none') return null;
  if (form.exp === 'pick') return form.pick;
  return addDays(today, Number(form.exp));
}

export function canSubmit(form: AddForm): boolean {
  return form.name.trim().length > 0 && form.qty > 0;
}

export function toAddInput(
  form: AddForm,
  today: IsoDate,
  places: StoragePlace[] = DEFAULT_PLACES
): AddInput {
  const food = form.kind === 'food';
  return {
    name: form.name.trim(),
    kind: form.kind,
    place: form.place,
    unit: form.unit,
    qty: form.qty,
    exp: food ? formExp(form, today) : null,
    split:
      food && form.split
        ? { portions: form.portions, fridge: fridgeCount(form, places) }
        : undefined,
  };
}

export function unitSourceText(form: AddForm): string {
  const u = form.unit;
  switch (form.unitSrc) {
    case 'hist':
      return `지난번처럼 ${u} 단위로 채웠어요`;
    case 'dict':
      return `자주 쓰는 식재료 목록에서 ${u} 단위로 채웠어요`;
    case 'user':
      return '직접 고른 단위예요 · 다음부터 이 단위로 채워요';
    default:
      return form.name.trim()
        ? `처음 넣는 품목이라 ${u}(으)로 시작해요 · 바꾸기로 고를 수 있어요`
        : '이름을 쓰면 단위를 알아서 채워요';
  }
}
