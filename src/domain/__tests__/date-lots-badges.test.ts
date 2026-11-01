import { consBadge, consDays, dBadge, expTone, foodSummary } from '../badges';
import { addDays, daysBetween, monthDay, todayIso } from '../date';
import { lotText, lotsOf, totalText } from '../lots';
import { SEED_TODAY, seedData } from '../seed';
import type { ConsumableItem, Lot } from '../types';
import { food } from '../__fixtures__/helpers';

const lot = (patch: Partial<Lot>): Lot => ({
  id: 'x',
  exp: null,
  qty: 1,
  unit: '개',
  size: null,
  place: '냉장',
  bought: SEED_TODAY,
  by: '나',
  ...patch,
});

describe('date', () => {
  it('일수 계산은 월·연도를 넘어가도 정확하다', () => {
    expect(daysBetween('2026-10-23', '2026-10-25')).toBe(2);
    expect(daysBetween('2026-10-25', '2026-10-23')).toBe(-2);
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('표시 형식', () => {
    expect(monthDay('2026-11-02')).toBe('11월 2일');
    expect(todayIso(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('lots', () => {
  it('로트 양 표시', () => {
    expect(lotText(lot({ qty: 3 }))).toBe('3개');
    expect(lotText(lot({ unit: 'g', size: 200, qty: 2 }))).toBe('200g × 2팩');
  });

  it('여러 로트를 단위별로 합친다', () => {
    expect(
      totalText([
        lot({ unit: 'g', size: 200, qty: 1 }),
        lot({ qty: 2 }),
        lot({ unit: 'g', size: 200, qty: 2 }),
      ])
    ).toBe('200g × 3팩 · 2개');
    expect(totalText([])).toBe('0');
  });

  it('기한 가까운 로트부터, 기한 없는 로트는 뒤로 정렬한다', () => {
    const { items } = seedData();
    const tofu = food(items, 'tofu');
    expect(lotsOf(tofu, SEED_TODAY).map((l) => l.exp)).toEqual(['2026-10-27', '2026-10-30']);

    const mixed = { ...tofu, lots: [lot({ id: 'a' }), lot({ id: 'b', exp: '2026-10-24' })] };
    expect(lotsOf(mixed, SEED_TODAY).map((l) => l.id)).toEqual(['b', 'a']);
  });

  it('보관 장소로 거르고 다 먹은 로트는 뺀다', () => {
    const { items } = seedData();
    const chicken = food(items, 'chicken');
    expect(lotsOf(chicken, SEED_TODAY, '냉동')).toHaveLength(1);
    chicken.lots[0].qty = 0;
    expect(lotsOf(chicken, SEED_TODAY)).toHaveLength(1);
  });
});

describe('badges', () => {
  it('기한 배지 문구', () => {
    expect(dBadge(-2)).toBe('2일 지남');
    expect(dBadge(0)).toBe('D-day');
    expect(dBadge(5)).toBe('D-5');
  });

  it('기한 색: 3일 이하 주의, 7일 이하 기본, 그 뒤 여유', () => {
    expect(expTone(3)).toBe('orange');
    expect(expTone(4)).toBe('gray');
    expect(expTone(7)).toBe('gray');
    expect(expTone(8)).toBe('green');
  });

  it('식품 요약: 기한 있으면 D-n, 없으면 n일째(14일부터 주의)', () => {
    const { items } = seedData();
    expect(foodSummary(food(items, 'cereal'), SEED_TODAY)).toMatchObject({
      days: 2,
      badge: 'D-2',
      tone: 'orange',
    });
    expect(foodSummary(food(items, 'daepa'), SEED_TODAY)).toMatchObject({
      days: null,
      badge: '8일째',
      tone: 'gray',
    });
    expect(foodSummary(food(items, 'onion'), SEED_TODAY)).toMatchObject({
      badge: '18일째',
      tone: 'orange',
    });
  });

  it('소모품 소진 예측', () => {
    const { items } = seedData();
    const c = (id: string) => items.find((i) => i.id === id) as ConsumableItem;
    expect(consDays(c('trash'))).toBe(6);
    expect(consBadge(c('trash'), SEED_TODAY)).toEqual({ text: '이번 주', tone: 'blue' });
    expect(consBadge(c('razor'), SEED_TODAY)).toEqual({ text: '11월 2일쯤', tone: 'blue' });
    expect(consBadge(c('tissue'), SEED_TODAY)).toEqual({ text: '11월 24일쯤', tone: 'gray' });
    expect(consBadge(c('paste'), SEED_TODAY)).toEqual({ text: '12월 중', tone: 'gray' });
    expect(consBadge({ ...c('paste'), qty: 0 }, SEED_TODAY)).toEqual({
      text: '다 썼어요',
      tone: 'orange',
    });
  });
});
