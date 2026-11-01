import { create } from 'zustand';

import {
  addMeal,
  addStock,
  addToShop,
  buyOne,
  changeMeal,
  completeMeal,
  completeShop,
  DEFAULT_PLACES,
  DEFAULT_RULES,
  nameProblem,
  placeInUse,
  removeBlocker,
  eat,
  moveLot,
  removeMeal,
  removeShop,
  removeShopByName,
  SEED_TODAY,
  seedData,
  setLotQty,
  splitLot,
  storeInboxItem,
  toggleMeal,
  toggleShop,
  useOne,
  type AddInput,
  type Change,
  type Ctx,
  type InboxItem,
  type IsoDate,
  type Item,
  type MealEntry,
  type Place,
  type PlaceKind,
  type Rules,
  type StoragePlace,
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
  /** 계산에 쓰는 우리 집 규칙 (설정 화면) */
  rules: Rules;
  /** 보관 장소 (순서대로 화면에 보임) */
  places: StoragePlace[];
  /** 계산 밖의 설정 값 (알림은 Phase 7에서 실제로 보냄) */
  prefs: Prefs;

  setRules: (patch: Partial<Rules>) => void;
  /** 보관 장소 추가. 이름이 비었거나 겹치면 토스트로 알리고 false */
  addPlace: (name: string, kind: PlaceKind) => boolean;
  /** 이름·종류 바꾸기. 안 되면 토스트로 알리고 false */
  updatePlace: (id: string, patch: { name?: string; kind?: PlaceKind }) => boolean;
  movePlace: (id: string, dir: -1 | 1) => void;
  /** 지우기. 쓰는 중이거나 그 종류의 마지막 장소면 토스트로 알리고 false */
  removePlace: (id: string) => boolean;
  setPrefs: (patch: Partial<Prefs>) => void;
  /** 모든 재고·장보기·한끼를 지운다 (할 일과 설정은 남김) */
  clearAll: () => void;
  /** 시안 샘플 데이터로 되돌린다 (개발용) */
  resetSample: () => void;

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
  toggleShop: (id: string) => void;
  removeShop: (id: string) => void;
  /** 장보기 완료: 체크한 것을 정리할 것으로 */
  completeShop: () => void;
  /** 정리할 것을 기본값 그대로 재고에 넣기 */
  storeInbox: (inboxId: string) => void;
  /**
   * 빠른 추가. 넣은 품목 id를 돌려준다 (못 넣었으면 null).
   * inboxId를 주면 정리할 것에서 온 것: 산 사람으로 기록하고 정리할 것에서 뺀다
   */
  addStock: (input: AddInput, inboxId?: string) => string | null;
  addTask: (text: string) => void;
  toggleTask: (id: string) => void;
  clearDoneTasks: () => void;
  addMeal: (itemId: string, lotId?: string) => void;
  changeMeal: (id: string, dir: 1 | -1) => void;
  toggleMeal: (id: string) => void;
  removeMeal: (id: string) => void;
  /** 한끼 완료: 체크한 재료만큼 재고에서 뺀다 */
  completeMeal: () => void;
  removeMealByItem: (itemId: string) => void;
};

let seq = 0;
const newId = () => `${Date.now().toString(36)}-${++seq}`;

export type Prefs = {
  /** 기한 알림 */
  expAlert: boolean;
  /** 생활용품 떨어짐 알림 */
  lowAlert: boolean;
  /** 알림 받는 시간 (예: '오전 9시') */
  alertTime: string;
  /** 곧 떨어지는 품목을 장보기에 추천 */
  autoRecommend: boolean;
  /** 장본 건 정리함으로 (끄면 장보기 완료 시 바로 재고에) */
  useInbox: boolean;
  /** 기록 보관 기간(개월) */
  logMonths: number;
};

export const DEFAULT_PREFS: Prefs = {
  expAlert: true,
  lowAlert: true,
  alertTime: '오전 9시',
  autoRecommend: true,
  useInbox: true,
  logMonths: 6,
};

const inboxLeftText = (inbox: InboxItem[]) =>
  inbox.length ? ` · 정리할 것 ${inbox.length}개 남음` : ' · 정리 끝';

export const useHome = create<HomeState>((set, get) => {
  const ctx = (): Ctx => ({
    today: get().today,
    by: get().me,
    newId,
    rules: get().rules,
    places: get().places,
  });

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
    rules: DEFAULT_RULES,
    places: DEFAULT_PLACES,
    prefs: DEFAULT_PREFS,

    setRules: (patch) => set({ rules: { ...get().rules, ...patch } }),
    addPlace: (name, kind) => {
      const problem = nameProblem(get().places, name);
      if (problem) {
        showToast(problem);
        return false;
      }
      set({ places: [...get().places, { id: newId(), name: name.trim(), kind }] });
      showToast(`${name.trim()}을(를) 추가했어요`);
      return true;
    },
    updatePlace: (id, patch) => {
      const { places } = get();
      const cur = places.find((p) => p.id === id);
      if (!cur) return false;
      if (patch.name !== undefined) {
        const problem = nameProblem(places, patch.name, id);
        if (problem) {
          showToast(problem);
          return false;
        }
      }
      // 종류를 바꾸면 원래 종류가 하나도 안 남는지 확인
      if (patch.kind && patch.kind !== cur.kind) {
        const blocker = removeBlocker(places, id, false);
        if (blocker) {
          showToast(blocker);
          return false;
        }
      }
      set({
        places: places.map((p) =>
          p.id === id ? { ...p, ...patch, name: (patch.name ?? p.name).trim() } : p
        ),
      });
      return true;
    },
    movePlace: (id, dir) => {
      const places = [...get().places];
      const i = places.findIndex((p) => p.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= places.length) return;
      [places[i], places[j]] = [places[j], places[i]];
      set({ places });
    },
    removePlace: (id) => {
      const { places, items, shop, inbox } = get();
      const blocker = removeBlocker(places, id, placeInUse(id, items, shop, inbox));
      if (blocker) {
        showToast(blocker);
        return false;
      }
      set({ places: places.filter((p) => p.id !== id) });
      return true;
    },
    setPrefs: (patch) => set({ prefs: { ...get().prefs, ...patch } }),
    clearAll: () => {
      set({ items: [], shop: [], inbox: [], meal: [] });
      showToast('모든 재고를 지웠어요');
    },
    resetSample: () => {
      set({ ...seedData(), meal: [] });
      showToast('샘플 데이터로 되돌렸어요');
    },

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
    toggleShop: (id) => set({ shop: toggleShop(get().shop, id) }),
    removeShop: (id) => set({ shop: removeShop(get().shop, id) }),
    completeShop: () => {
      const r = completeShop(get().shop, get().inbox, ctx());
      if (!r) return;
      if (get().prefs.useInbox) {
        set({ shop: r.next.shop, inbox: r.next.inbox });
        showToast(r.message);
        return;
      }
      // 정리함을 쓰지 않으면 산 것을 기본값 그대로 바로 재고에 넣는다
      const added = r.next.inbox.slice(get().inbox.length);
      let items = get().items;
      for (const entry of added) items = storeInboxItem(items, entry, ctx())?.next ?? items;
      set({ shop: r.next.shop, items });
      showToast(`${added.length}개를 재고에 바로 넣었어요`);
    },
    storeInbox: (inboxId) => {
      const entry = get().inbox.find((x) => x.id === inboxId);
      if (!entry) return;
      const r = storeInboxItem(get().items, entry, ctx());
      if (!r) return;
      const inbox = get().inbox.filter((x) => x.id !== inboxId);
      set({ items: r.next, inbox });
      showToast(`${r.message}${inboxLeftText(inbox)}`);
    },
    addStock: (input, inboxId) => {
      const entry = inboxId ? get().inbox.find((x) => x.id === inboxId) : undefined;
      const r = addStock(get().items, input, { ...ctx(), by: entry?.by ?? get().me });
      if (!r) return null;
      const inbox = entry ? get().inbox.filter((x) => x.id !== entry.id) : get().inbox;
      set({ items: r.next, inbox });
      showToast(entry ? `${r.message}${inboxLeftText(inbox)}` : r.message);
      return r.itemId;
    },
    addTask: (text) => {
      const t = text.trim();
      if (!t) return;
      set({ tasks: [...get().tasks, { id: newId(), text: t, done: false }] });
    },
    toggleTask: (id) =>
      set({ tasks: get().tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }),
    clearDoneTasks: () => set({ tasks: get().tasks.filter((t) => !t.done) }),
    addMeal: (itemId, lotId) =>
      apply(addMeal(get().meal, get().items, itemId, lotId ?? null, ctx()), (meal) => ({ meal })),
    changeMeal: (id, dir) => {
      const r = changeMeal(get().meal, get().items, id, dir, get().today);
      set({ meal: r.next });
      if (r.message) showToast(r.message);
    },
    toggleMeal: (id) => set({ meal: toggleMeal(get().meal, id) }),
    removeMeal: (id) => set({ meal: removeMeal(get().meal, id) }),
    completeMeal: () =>
      apply(completeMeal(get().items, get().meal, ctx()), ({ items, meal }) => ({ items, meal })),
    removeMealByItem: (itemId) => {
      const name = get().items.find((i) => i.id === itemId)?.name ?? '';
      set({ meal: get().meal.filter((m) => m.itemId !== itemId) });
      showToast(`${name} 다음 한끼에서 뺐어요`);
    },
  };
});
