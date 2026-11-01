import { SEED_TODAY, seedData, type MealEntry } from '@/domain';
import { mealRows, mealSuggestions, pickerGroups } from '@/features/meal/meal-view';

const entry = (patch: Partial<MealEntry>): MealEntry => ({
  id: 'm1',
  itemId: 'chicken',
  lotId: 'x',
  label: '팩',
  qty: 1,
  checked: false,
  ...patch,
});

describe('다음 한끼 화면', () => {
  it('담은 재료: 재고와 기한, 여러 묶음에서 꺼내는지 알려준다', () => {
    const { items } = seedData();
    const rows = mealRows(
      items,
      [entry({ qty: 2 }), entry({ id: 'm2', itemId: 'gone' })],
      SEED_TODAY
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: '닭다리살',
      place: '냉장',
      amount: '2팩',
      rest: 'D-2 · 재고 3팩 · 다른 묶음에서도 꺼내요',
    });
  });

  it('먼저 먹으면 좋아요: 급한 순, 이미 담은 건 뺀다', () => {
    const { items } = seedData();
    expect(mealSuggestions(items, [], SEED_TODAY).map((s) => s.name)).toEqual([
      '닭다리살',
      '요거트',
      '시리얼',
      '우유',
      '양파',
    ]);
    expect(mealSuggestions(items, [entry({})], SEED_TODAY).map((s) => s.name)).not.toContain(
      '닭다리살'
    );
  });

  it('재료 고르기: 장소별, 검색어로 거른다', () => {
    const { items } = seedData();
    const groups = pickerGroups(items, [entry({})], SEED_TODAY, '');
    expect(groups.map((g) => g.place)).toEqual(['냉장', '냉동', '실온']);
    expect(groups[1].items.map((i) => [i.name, i.inMeal])).toEqual([
      ['닭다리살', true],
      ['만두', false],
    ]);
    expect(
      pickerGroups(items, [], SEED_TODAY, '파').flatMap((g) => g.items.map((i) => i.name))
    ).toEqual(['대파', '양파']);
  });
});
