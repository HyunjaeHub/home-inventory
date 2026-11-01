import { inboxPlan, prefillFor } from '../add';
import {
  DEFAULT_PLACES,
  firstOfKind,
  kindOf,
  nameProblem,
  placeInUse,
  placeName,
  removeBlocker,
  type StoragePlace,
} from '../places';
import { SEED_TODAY, seedData } from '../seed';
import { adjustExp, moveLot } from '../stock';
import { food, makeCtx } from '../__fixtures__/helpers';

const places: StoragePlace[] = [
  ...DEFAULT_PLACES,
  { id: 'kimchi', name: '김치냉장고', kind: 'fridge' },
  { id: 'deep', name: '딥프리저', kind: 'freezer' },
  { id: 'veranda', name: '베란다', kind: 'pantry' },
];

describe('보관 장소', () => {
  it('종류·이름·첫 장소', () => {
    expect(kindOf(places, 'kimchi')).toBe('fridge');
    expect(placeName(places, 'deep')).toBe('딥프리저');
    expect(firstOfKind(places, 'freezer')).toBe('냉동');
    expect(placeName(places, '모르는곳')).toBe('모르는곳');
  });

  it('규칙은 이름이 아니라 종류로 판단한다', () => {
    expect(adjustExp('2026-12-20', 'deep', 'kimchi', SEED_TODAY, undefined, places)).toBe(
      '2026-10-25'
    );
    expect(adjustExp('2026-10-25', 'kimchi', 'deep', SEED_TODAY, undefined, places)).toBe(
      '2026-11-22'
    );
    expect(adjustExp('2026-10-25', 'kimchi', 'veranda', SEED_TODAY, undefined, places)).toBe(
      '2026-10-25'
    );
  });

  it('딥프리저에서 해동하면 첫 냉장 장소로 간다', () => {
    const { items } = seedData();
    const lot = food(items, 'mandu').lots[0];
    lot.place = 'deep';
    const r = moveLot(items, 'mandu', lot.id, makeCtx({ places }));
    expect(r?.message).toContain('해동했어요');
    expect(food(r!.next, 'mandu').lots.find((l) => l.id === lot.id)?.place).toBe('냉장');
  });

  it('장보기에서 실온 종류 장소로 담은 새 품목은 기한 없이', () => {
    expect(prefillFor([], '바나나', 'veranda', places)).toMatchObject({
      kind: 'food',
      place: 'veranda',
      exp: 'none',
    });
    expect(
      inboxPlan([], { id: 'x', name: '세제', place: '생활', by: '나', date: SEED_TODAY }, places)
    ).toMatchObject({ kind: 'cons', place: '생활' });
  });

  it('지우기 막는 이유: 쓰는 중이거나 그 종류의 마지막 장소', () => {
    const { items, shop, inbox } = seedData();
    expect(placeInUse('냉장', items, shop, inbox)).toBe(true);
    expect(placeInUse('kimchi', items, shop, inbox)).toBe(false);
    expect(removeBlocker(places, 'kimchi', false)).toBeNull();
    expect(removeBlocker(DEFAULT_PLACES, '냉동', false)).toBe(
      '냉동 종류 장소는 한 곳 이상 있어야 해요'
    );
    expect(removeBlocker(places, '냉장', true)).toBe('냉장에 재고나 살 것이 있어서 지울 수 없어요');
  });

  it('이름 확인', () => {
    expect(nameProblem(places, ' ')).toBe('이름을 입력해 주세요');
    expect(nameProblem(places, '베란다')).toBe('같은 이름의 장소가 있어요');
    expect(nameProblem(places, '베란다', 'veranda')).toBeNull();
  });
});
