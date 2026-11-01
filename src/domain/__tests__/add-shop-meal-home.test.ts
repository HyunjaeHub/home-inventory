import { addStock, inboxPlan, prefillFor, storeInboxItem, unitGuess } from '../add';
import { expiredLotCount, expiringSoon, oldFoods, runningOut, usedUpNotInShop } from '../home';
import { lotsOf } from '../lots';
import { addMeal, changeMeal, completeMeal, mealStep } from '../meal';
import { SEED_TODAY, seedData } from '../seed';
import { addToShop, completeShop, removeShopByName } from '../shopping';
import type { ConsumableItem } from '../types';
import { food, makeCtx } from '../__fixtures__/helpers';

describe('빠른 추가', () => {
  it('이름으로 단위를 추정한다', () => {
    expect(unitGuess('삼겹살')).toBe('g');
    expect(unitGuess('대파')).toBe('단');
    expect(unitGuess('샴푸')).toBe('통');
    expect(unitGuess('아보카도')).toBeNull();
  });

  it('예전에 넣은 품목은 그 설정으로, 처음이면 사전으로 미리 채운다', () => {
    const { items } = seedData();
    expect(prefillFor(items, '닭다리살')).toMatchObject({
      kind: 'food',
      place: '냉동',
      unit: 'g',
      qty: 600,
      split: true,
      source: 'hist',
    });
    expect(prefillFor(items, '삼겹살')).toMatchObject({ unit: 'g', split: true, source: 'dict' });
    expect(prefillFor(items, '샴푸')).toMatchObject({ kind: 'cons', unit: '통' });
    expect(prefillFor(items, '바나나', '실온')).toMatchObject({ exp: 'none', source: 'new' });
  });

  it('600g을 3팩으로 나눠 냉동, 1팩은 바로 냉장', () => {
    const { items } = seedData();
    const r = addStock(
      items,
      {
        name: '삼겹살',
        kind: 'food',
        place: '냉동',
        unit: 'g',
        qty: 600,
        exp: '2026-11-22',
        split: { portions: 3, fridge: 1 },
      },
      makeCtx()
    );
    expect(r?.message).toBe('삼겹살 3팩으로 나눠 넣었어요');
    const it = food(r!.next, r!.itemId);
    expect(it.lots.map((l) => [l.place, l.size, l.qty, l.exp])).toEqual([
      ['냉장', 200, 1, '2026-10-25'],
      ['냉동', 200, 2, '2026-11-22'],
    ]);
    expect(it.log[0].text).toBe('600g 사서 3팩으로 나눔');
  });

  it('있는 소모품에 더하고, 이름이 비었거나 수량이 0이면 무시한다', () => {
    const { items } = seedData();
    const r = addStock(
      items,
      { name: '휴지', kind: 'cons', place: '생활', unit: '롤', qty: 6, exp: null },
      makeCtx()
    );
    expect((r!.next.find((i) => i.id === 'tissue') as ConsumableItem).qty).toBe(14);
    expect(
      addStock(
        items,
        { name: ' ', kind: 'food', place: '냉장', unit: '개', qty: 1, exp: null },
        makeCtx()
      )
    ).toBeNull();
    expect(
      addStock(
        items,
        { name: '우유', kind: 'food', place: '냉장', unit: '개', qty: 0, exp: null },
        makeCtx()
      )
    ).toBeNull();
  });

  it('그대로 넣을 때 들어갈 곳 미리보기', () => {
    const { items, inbox } = seedData();
    expect(inboxPlan(items, inbox[0])).toEqual({ kind: 'food', place: '냉장', unit: '개' });
    expect(inboxPlan(items, { ...inbox[0], name: '닭다리살' })).toEqual({
      kind: 'food',
      place: '냉동',
      unit: '팩',
    });
    expect(inboxPlan(items, { ...inbox[0], name: '샴푸', place: '생활' }).kind).toBe('cons');
  });

  it('정리할 것을 기본값으로 바로 넣는다', () => {
    const { items, inbox } = seedData();
    const r = storeInboxItem(items, inbox[0], makeCtx());
    expect(r?.message).toBe('삼겹살 냉장에 넣었어요');
    const pork = r!.next.find((i) => i.name === '삼겹살');
    expect(pork).toMatchObject({ kind: 'food', place: '냉장' });
    expect(pork?.kind === 'food' && pork.lots[0]).toMatchObject({ exp: '2026-10-30', by: '남편' });

    const r2 = storeInboxItem(items, inbox[1], makeCtx());
    expect(food(r2!.next, 'daepa').lots).toHaveLength(2);
  });
});

describe('장보기', () => {
  it('중복으로 담지 않는다', () => {
    const { items, shop } = seedData();
    expect(addToShop(shop, items, '우유', makeCtx())?.message).toBe(
      '우유은(는) 이미 살 것에 있어요'
    );
    const r = addToShop(shop, items, '계란', makeCtx());
    expect(r?.next.at(-1)).toMatchObject({ name: '계란', place: '냉장', checked: false });
  });

  it('완료하면 체크한 것만 정리할 것으로 옮긴다', () => {
    const { shop, inbox } = seedData();
    const r = completeShop(shop, inbox, makeCtx());
    expect(r?.next.shop.map((s) => s.name)).toEqual(['양파', '식용유']);
    expect(r?.next.inbox.map((s) => s.name)).toEqual(['삼겹살', '대파', '우유', '샴푸']);
    expect(completeShop(r!.next.shop, [], makeCtx())).toBeNull();
  });

  it('이름으로 뺄 때 이미 산(체크한) 것은 남긴다', () => {
    const { shop } = seedData();
    expect(removeShopByName(shop, '우유')).toHaveLength(4);
    expect(removeShopByName(shop, '양파')).toHaveLength(3);
  });
});

describe('다음 한끼', () => {
  it('담기: 품목당 한 줄, 팩 단위', () => {
    const { items } = seedData();
    const r = addMeal([], items, 'chicken', null, makeCtx());
    expect(r?.next[0]).toMatchObject({ itemId: 'chicken', label: '팩', qty: 1 });
    expect(addMeal(r!.next, items, 'chicken', null, makeCtx())?.message).toBe(
      '닭다리살은(는) 이미 다음 한끼에 있어요'
    );
  });

  it('재고보다 많이 담을 수 없다', () => {
    const { items } = seedData();
    let meal = addMeal([], items, 'chicken', null, makeCtx())!.next;
    const id = meal[0].id;
    meal = changeMeal(meal, items, id, 1, SEED_TODAY).next;
    meal = changeMeal(meal, items, id, 1, SEED_TODAY).next;
    const over = changeMeal(meal, items, id, 1, SEED_TODAY);
    expect(over.next[0].qty).toBe(3);
    expect(over.message).toBe('재고에 있는 3팩까지 담을 수 있어요');
  });

  it('대파는 반 단씩', () => {
    const { items } = seedData();
    expect(mealStep(food(items, 'daepa').lots[0])).toBe(0.5);
  });

  it('완료하면 기한 가까운 팩부터 빼고 체크 안 한 항목은 남긴다', () => {
    const { items } = seedData();
    const ctx = makeCtx();
    let meal = addMeal([], items, 'chicken', null, ctx)!.next;
    meal = addMeal(meal, items, 'egg', null, ctx)!.next;
    meal = [{ ...meal[0], qty: 2, checked: true }, meal[1]];
    const r = completeMeal(items, meal, ctx);
    expect(r?.message).toBe('해치웠어요! 1가지를 재고에서 뺐어요');
    const left = lotsOf(food(r!.next.items, 'chicken'), SEED_TODAY);
    expect(left.map((l) => [l.place, l.qty])).toEqual([['냉동', 1]]);
    expect(r?.next.meal.map((m) => m.itemId)).toEqual(['egg']);
  });

  it('반 단 먹으면 0.5단 남는다', () => {
    const { items } = seedData();
    const ctx = makeCtx();
    const meal = addMeal([], items, 'daepa', null, ctx)!.next.map((m) => ({
      ...m,
      qty: 0.5,
      checked: true,
    }));
    const r = completeMeal(items, meal, ctx);
    expect(food(r!.next.items, 'daepa').lots[0].qty).toBe(0.5);
  });
});

describe('홈 요약', () => {
  it('기한 임박 식품 (3일 이내)', () => {
    const { items } = seedData();
    expect(expiringSoon(items, SEED_TODAY).map((x) => x.item.name)).toEqual([
      '닭다리살',
      '요거트',
      '시리얼',
      '우유',
    ]);
  });

  it('오래 둔 야채, 곧 떨어질 소모품, 기한 지난 것', () => {
    const { items, shop } = seedData();
    expect(oldFoods(items, SEED_TODAY).map((x) => [x.item.name, x.age])).toEqual([['양파', 18]]);
    expect(runningOut(items).map((x) => x.name)).toEqual(['쓰레기봉투', '면도기날', '수세미']);
    expect(expiredLotCount(items, SEED_TODAY)).toBe(0);
    expect(expiredLotCount(items, '2026-10-26')).toBe(3);
    const used = items.map((i) => (i.id === 'razor' ? { ...i, qty: 0 } : i));
    expect(usedUpNotInShop(used, shop).map((x) => x.name)).toEqual(['면도기날']);
  });
});
