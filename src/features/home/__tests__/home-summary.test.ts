import { SEED_TODAY, seedData } from '@/domain';
import { checkLines, expiryStrip, mealNames, weekdayOf } from '@/features/home/home-summary';

describe('홈 요약', () => {
  it('이번 주 기한 띠: 2주+ 칸과 오늘부터 7일', () => {
    const { items } = seedData();
    const { cols, laterCount } = expiryStrip(items, SEED_TODAY);
    expect(cols).toHaveLength(8);
    expect(cols[0].entries.map((e) => e.item.name)).toEqual(['양파']);
    // 10/25(D-2): 닭다리살 냉장 팩, 요거트, 시리얼
    expect(cols[3].entries.map((e) => e.item.name).sort()).toEqual([
      '닭다리살',
      '시리얼',
      '요거트',
    ]);
    expect(cols[3]).toMatchObject({ key: 2, date: '2026-10-25' });
    // 7일 뒤(10/30~) 기한: 닭다리살 냉동, 요거트·우유 둘째 로트, 계란, 두부 둘째, 만두 → 품목 6가지
    expect(laterCount).toBe(6);
  });

  it('기한 지난 것은 오늘 칸에 모은다', () => {
    const { items } = seedData();
    const { cols } = expiryStrip(items, '2026-10-26');
    expect(cols[1].entries.map((e) => e.item.name)).toEqual(
      expect.arrayContaining(['닭다리살', '요거트', '시리얼', '우유'])
    );
  });

  it('확인할 것', () => {
    const { items, shop, inbox } = seedData();
    expect(checkLines(items, shop, inbox, SEED_TODAY)).toEqual([
      { text: '장본 것 정리', detail: '삼겹살, 대파', target: 'inbox' },
      { text: '오래 둔 재료', detail: '양파', target: 'stock' },
    ]);
    expect(checkLines(items, shop, [], '2026-10-26')[0]).toEqual({
      text: '기한 지난 것',
      detail: '3개',
      target: 'stock',
    });
  });

  it('한끼 이름과 요일', () => {
    const { items } = seedData();
    const meal = [
      { id: 'm1', itemId: 'tofu', lotId: 'x', label: '개', qty: 1, checked: false },
      { id: 'm2', itemId: 'gone', lotId: 'x', label: '개', qty: 1, checked: false },
    ];
    expect(mealNames(items, meal, SEED_TODAY)).toEqual(['두부']);
    expect(weekdayOf(SEED_TODAY)).toBe('금');
  });
});
