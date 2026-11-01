import { lotsOf } from '../lots';
import { SEED_TODAY, seedData } from '../seed';
import { adjustExp, buyOne, eat, moveLot, setLotQty, splitLot, useOne } from '../stock';
import type { Item } from '../types';
import { food, makeCtx } from '../__fixtures__/helpers';

describe('eat', () => {
  it('기한 가까운 로트부터 1팩 먹고, 원본은 바꾸지 않는다', () => {
    const { items } = seedData();
    const r = eat(items, 'chicken', null, makeCtx());
    expect(r?.message).toBe('닭다리살 1팩 먹음 · 200g × 2팩 남음');
    const lots = food(r!.next, 'chicken').lots;
    expect(lots).toHaveLength(1);
    expect(lots[0].place).toBe('냉동');
    expect(food(items, 'chicken').lots).toHaveLength(2);
  });

  it('기록을 맨 앞에 남긴다', () => {
    const { items } = seedData();
    const r = eat(items, 'egg', null, makeCtx({ by: '남편' }));
    expect(food(r!.next, 'egg').log[0]).toEqual({ text: '1개 먹음', by: '남편', date: SEED_TODAY });
  });

  it('소분 안 한 g 덩어리는 통째로 먹는다', () => {
    const { items } = seedData();
    food(items, 'chicken').lots = [
      { ...food(items, 'chicken').lots[0], size: null, qty: 600, place: '냉장' },
    ];
    const r = eat(items, 'chicken', null, makeCtx());
    expect(r?.message).toBe('닭다리살 600g 다 먹음 · 다 먹었어요');
    expect(food(r!.next, 'chicken').lots).toHaveLength(0);
  });

  it('없는 품목이나 다 먹은 품목은 아무것도 안 한다', () => {
    const { items } = seedData();
    expect(eat(items, 'nope', null, makeCtx())).toBeNull();
    expect(eat(items, 'trash', null, makeCtx())).toBeNull();
  });
});

describe('adjustExp / moveLot', () => {
  it('해동하면 기한을 최대 2일로 줄이고, 냉동하면 최소 30일로 늘린다', () => {
    expect(adjustExp('2026-12-20', '냉동', '냉장', SEED_TODAY)).toBe('2026-10-25');
    expect(adjustExp('2026-10-24', '냉동', '냉장', SEED_TODAY)).toBe('2026-10-24');
    expect(adjustExp(null, '냉동', '냉장', SEED_TODAY)).toBe('2026-10-25');
    expect(adjustExp('2026-10-25', '냉장', '냉동', SEED_TODAY)).toBe('2026-11-22');
    expect(adjustExp('2027-01-01', '냉장', '냉동', SEED_TODAY)).toBe('2027-01-01');
    expect(adjustExp(null, '냉장', '냉동', SEED_TODAY)).toBeNull();
  });

  it('설정의 규칙 값을 따른다', () => {
    const rules = { urgentDays: 3, chillDays: 1, freezeMinDays: 60, oldDays: 14, consSoonDays: 14 };
    expect(adjustExp('2026-12-20', '냉동', '냉장', SEED_TODAY, rules)).toBe('2026-10-24');
    expect(adjustExp('2026-10-25', '냉장', '냉동', SEED_TODAY, rules)).toBe('2026-12-22');
  });

  it('냉동 2팩 중 1팩만 떼어서 해동한다', () => {
    const { items } = seedData();
    const frozen = food(items, 'chicken').lots.find((l) => l.place === '냉동')!;
    const r = moveLot(items, 'chicken', frozen.id, makeCtx());
    expect(r?.message).toBe('닭다리살 1팩 해동했어요 · 10월 25일까지 먹기');
    const lots = food(r!.next, 'chicken').lots;
    expect(lots.find((l) => l.id === frozen.id)).toMatchObject({ qty: 1, place: '냉동' });
    expect(lots.find((l) => l.id === 'new1')).toMatchObject({
      qty: 1,
      place: '냉장',
      exp: '2026-10-25',
    });
  });

  it('냉장 로트를 냉동실로 옮긴다', () => {
    const { items } = seedData();
    const l = food(items, 'tofu').lots[0];
    const r = moveLot(items, 'tofu', l.id, makeCtx());
    expect(r?.message).toBe('두부 1개 냉동실로 옮겼어요');
    expect(food(r!.next, 'tofu').lots.find((x) => x.id === l.id)).toMatchObject({
      place: '냉동',
      exp: '2026-11-22',
    });
  });
});

describe('소모품', () => {
  it('사용하면 줄고, 다 쓰면 더 못 쓴다', () => {
    const { items } = seedData();
    const r = useOne(items, 'razor', makeCtx());
    expect(r?.message).toBe('면도기날 1개 썼어요 · 0개 남음');
    expect(useOne(r!.next, 'razor', makeCtx())).toBeNull();
    expect(buyOne(r!.next, 'razor', makeCtx())?.message).toBe('면도기날 1개 넣었어요');
  });
});

describe('setLotQty / splitLot', () => {
  it('1.5팩 남으면 1팩 + 반 팩(100g)으로 나눈다', () => {
    const { items } = seedData();
    const frozen = food(items, 'chicken').lots.find((l) => l.place === '냉동')!;
    const r = setLotQty(items, 'chicken', frozen.id, 1.5, makeCtx());
    const sizes = lotsOf(food(r!.next, 'chicken'), SEED_TODAY, '냉동').map((l) => [l.size, l.qty]);
    expect(sizes).toEqual([
      [200, 1],
      [100, 1],
    ]);
    expect(r?.message).toBe('닭다리살 남은 양을 고쳤어요 · 200g × 1팩 · 100g × 1팩');
  });

  it('0으로 고치면 로트를 지운다', () => {
    const { items } = seedData();
    const l = food(items, 'egg').lots[0];
    const r = setLotQty(items, 'egg', l.id, 0, makeCtx());
    expect(r?.message).toBe('계란 다 쓴 걸로 정리했어요');
    expect(food(r!.next, 'egg').lots).toHaveLength(0);
  });

  it('600g을 3팩으로 나누고 1팩은 냉장으로 보낸다', () => {
    const { items } = seedData();
    const bulk: Item[] = items.map((it) =>
      it.id === 'chicken' && it.kind === 'food'
        ? {
            ...it,
            lots: [{ ...it.lots[1], size: null, qty: 600, exp: '2026-12-20', place: '냉동' }],
          }
        : it
    );
    const lotId = food(bulk, 'chicken').lots[0].id;
    const r = splitLot(bulk, 'chicken', lotId, 3, 1, '냉장', makeCtx());
    expect(r?.message).toBe('닭다리살 3팩으로 나눴어요 · 냉장 1팩');
    const lots = food(r!.next, 'chicken').lots;
    expect(lots.map((l) => [l.place, l.size, l.qty, l.exp])).toEqual([
      ['냉동', 200, 2, '2026-12-20'],
      ['냉장', 200, 1, '2026-10-25'],
    ]);
  });
});
