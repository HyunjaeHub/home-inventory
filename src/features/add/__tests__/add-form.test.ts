import { SEED_TODAY, seedData } from '@/domain';
import {
  blankForm,
  packPlaces,
  toAddInput,
  togglePack,
  withKind,
  withName,
  withUnit,
  type AddForm,
} from '@/features/add/add-form';

describe('빠른 추가 폼', () => {
  it('예전에 넣은 품목은 그 설정으로 채운다', () => {
    const { items } = seedData();
    const f = withName(blankForm(), items, '닭다리살');
    expect(f).toMatchObject({
      kind: 'food',
      place: '냉동',
      unit: 'g',
      qty: 600,
      split: true,
      unitSrc: 'hist',
    });
  });

  it('처음 넣는 품목은 단위 사전으로, 직접 고른 단위는 유지한다', () => {
    const { items } = seedData();
    const f = withName(blankForm(), items, '삼겹살');
    expect(f).toMatchObject({ unit: 'g', qty: 500, split: true, unitSrc: 'dict' });
    expect(withName(blankForm(), items, '샴푸')).toMatchObject({
      kind: 'cons',
      place: '생활',
      unit: '통',
    });

    const user = withUnit(blankForm(), '봉');
    expect(withName(user, items, '삼겹살')).toMatchObject({ unit: '봉', unitSrc: 'user' });
  });

  it('종류를 바꾸면 장소와 단위를 맞춘다', () => {
    expect(withKind(blankForm(), 'cons')).toMatchObject({
      place: '생활',
      unit: '개',
      split: false,
    });
    expect(withKind({ ...blankForm(), place: '생활' }, 'food')).toMatchObject({ place: '냉장' });
  });

  it('무게 단위로 바꾸면 양을 500으로, 개수로 바꾸면 1로', () => {
    expect(withUnit(blankForm(), 'g').qty).toBe(500);
    expect(withUnit({ ...blankForm(), qty: 600 }, '개').qty).toBe(1);
  });

  it('팩을 눌러 냉장 ↔ 냉동', () => {
    let f: AddForm = { ...blankForm(), split: true, portions: 3, place: '냉동' };
    expect(packPlaces(f)).toEqual(['냉동', '냉동', '냉동']);
    f = togglePack(f, 0);
    expect(packPlaces(f)).toEqual(['냉장', '냉동', '냉동']);
    f = togglePack(togglePack(f, 1), 2);
    expect(f.place).toBe('냉장');
    expect(packPlaces(togglePack(f, 1))).toEqual(['냉장', '냉동', '냉장']);
  });

  it('저장 입력: 냉동 소분은 냉장 팩 수를 넘기고, 기한은 오늘 기준', () => {
    const f = togglePack(
      {
        ...blankForm(),
        name: ' 삼겹살 ',
        unit: 'g',
        qty: 600,
        split: true,
        place: '냉동',
        exp: '30',
      },
      0
    );
    expect(toAddInput(f, SEED_TODAY)).toEqual({
      name: '삼겹살',
      kind: 'food',
      place: '냉동',
      unit: 'g',
      qty: 600,
      exp: '2026-11-22',
      split: { portions: 3, fridge: 1 },
    });
    expect(
      toAddInput({ ...blankForm(), name: '휴지', kind: 'cons', exp: '7' }, SEED_TODAY).exp
    ).toBeNull();
  });
});
