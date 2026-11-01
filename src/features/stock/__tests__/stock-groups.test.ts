import { SEED_TODAY, seedData } from '@/domain';
import { filterCounts, stockGroups } from '@/features/stock/stock-groups';

describe('stockGroups', () => {
  it('장소별 개수: 식품은 로트가 있는 장소마다 센다', () => {
    const { items } = seedData();
    expect(filterCounts(items, SEED_TODAY)).toEqual({
      전체: 15,
      냉장: 6,
      냉동: 2,
      실온: 3,
      생활: 5,
    });
  });

  it('묶음 안은 급한 순, 냉장 닭다리살은 냉장 팩 기준으로 보인다', () => {
    const { items } = seedData();
    const fridge = stockGroups(items, SEED_TODAY, '냉장', '')[0];
    expect(fridge.place).toBe('냉장');
    expect(fridge.rows.slice(0, 3).map((r) => [r.name, r.badge])).toEqual([
      ['닭다리살', 'D-2'],
      ['요거트', 'D-2'],
      ['우유', 'D-3'],
    ]);
    expect(fridge.rows.find((r) => r.name === '요거트')?.sub).toBe('3개 · 기한 2가지');
    expect(fridge.rows.at(-1)).toMatchObject({
      name: '대파',
      badge: '8일째',
      sub: '1단 · 기한 없음',
    });
  });

  it('검색어로 거르고, 없으면 빈 목록', () => {
    const { items } = seedData();
    expect(
      stockGroups(items, SEED_TODAY, '전체', '두').flatMap((g) => g.rows.map((r) => r.name))
    ).toEqual(['두부', '만두']);
    expect(stockGroups(items, SEED_TODAY, '전체', '없는것')).toEqual([]);
  });
});
