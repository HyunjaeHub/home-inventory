import { create } from 'zustand';

import {
  addMeal,
  addToShop,
  buyOne,
  eat,
  moveLot,
  removeShopByName,
  SEED_TODAY,
  seedData,
  setLotQty,
  splitLot,
  useOne,
  type Change,
  type Ctx,
  type InboxItem,
  type IsoDate,
  type Item,
  type MealEntry,
  type Place,
  type ShopItem,
  type Task,
} from '@/domain';
import { showToast } from '@/stores/toast-store';

/**
 * Phase 3: 서버 없이 기기 메모리에만 두는 우리 집 데이터. 앱을 다시 켜면 시드 데이터로 돌아간다.
 * Phase 5에서 Supabase로 바꿀 때 액션 이름은 그대로 두고 안쪽만 바꾼다.
 */
type HomeState = {
  /** 시드 데이터가 2026-10-23 기준이라 그 날짜로 고정. Supabase 연동 때 todayIso()로 바꾼다 */
  today: IsoDate;
  me: string;
  items: Item[];
  shop: ShopItem[];
  inbox: InboxItem[];
  meal: MealEntry[];
  tasks: Task[];

  eat: (itemId: string, lotId?: string) => void;
  moveLot: (itemId: string, lotId: string) => void;
  useOne: (itemId: string) => void;
  buyOne: (itemId: string) => void;
  setLotQty: (itemId: string, lotId: string, value: number) => void;
  splitLot: (
    itemId: string,
    lotId: string,
    portions: number,
    other: number,
    otherPlace: Place
  ) => void;
  addToShop: (name: string, place?: Place) => void;
  removeFromShop: (name: string) => void;
  addMeal: (itemId: string, lotId?: string) => void;
  removeMealByItem: (itemId: string) => void;
};

let seq = 0;
const newId = () => `${Date.now().toString(36)}-${++seq}`;

export const useHome = create<HomeState>((set, get) => {
  const ctx = (): Ctx => ({ today: get().today, by: get().me, newId });

  /** 도메인 결과를 반영하고 토스트를 띄운다 */
  function apply<T>(change: Change<T>, update: (next: T) => Partial<HomeState>) {
    if (!change) return;
    set(update(change.next));
    showToast(change.message);
  }

  return {
    today: SEED_TODAY,
    me: '나',
    meal: [],
    ...seedData(),

    eat: (itemId, lotId) =>
      apply(eat(get().items, itemId, lotId ?? null, ctx()), (items) => ({ items })),
    moveLot: (itemId, lotId) =>
      apply(moveLot(get().items, itemId, lotId, ctx()), (items) => ({ items })),
    useOne: (itemId) => apply(useOne(get().items, itemId, ctx()), (items) => ({ items })),
    buyOne: (itemId) => apply(buyOne(get().items, itemId, ctx()), (items) => ({ items })),
    setLotQty: (itemId, lotId, value) =>
      apply(setLotQty(get().items, itemId, lotId, value, ctx()), (items) => ({ items })),
    splitLot: (itemId, lotId, portions, other, otherPlace) =>
      apply(splitLot(get().items, itemId, lotId, portions, other, otherPlace, ctx()), (items) => ({
        items,
      })),
    addToShop: (name, place) =>
      apply(addToShop(get().shop, get().items, name, ctx(), place), (shop) => ({ shop })),
    removeFromShop: (name) => {
      set({ shop: removeShopByName(get().shop, name) });
      showToast(`${name} 살 것에서 뺐어요`);
    },
    addMeal: (itemId, lotId) =>
      apply(addMeal(get().meal, get().items, itemId, lotId ?? null, ctx()), (meal) => ({ meal })),
    removeMealByItem: (itemId) => {
      const name = get().items.find((i) => i.id === itemId)?.name ?? '';
      set({ meal: get().meal.filter((m) => m.itemId !== itemId) });
      showToast(`${name} 다음 한끼에서 뺐어요`);
    },
  };
});
