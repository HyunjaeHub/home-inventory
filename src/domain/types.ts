/** 날짜는 모두 기기 로컬 기준 'YYYY-MM-DD' 문자열로 다룬다 (타임존 버그 방지). */
export type IsoDate = string;

export type Place = '냉장' | '냉동' | '실온' | '생활';

export const PLACES: readonly Place[] = ['냉장', '냉동', '실온', '생활'];

/** 같은 품목이라도 산 날·기한·보관 장소가 다르면 별도 로트로 관리한다 */
export type Lot = {
  id: string;
  /** 기한. 없으면 null (대파·양파처럼 기한 없이 관리하는 것) */
  exp: IsoDate | null;
  /** 개수. 소분 팩이면 팩 수 */
  qty: number;
  unit: string;
  /** 소분 팩 한 개의 양 (예: 200g짜리 팩이면 200). 소분하지 않았으면 null */
  size: number | null;
  place: Place;
  bought: IsoDate;
  by: string;
};

export type LogEntry = {
  text: string;
  by: string;
  date: IsoDate;
};

type ItemBase = {
  id: string;
  name: string;
  /** 기본 보관 장소 */
  place: Place;
  unit: string;
  /** 최신 기록이 앞 */
  log: LogEntry[];
};

export type FoodItem = ItemBase & {
  kind: 'food';
  noExp: boolean;
  lots: Lot[];
};

export type ConsumableItem = ItemBase & {
  kind: 'cons';
  qty: number;
  /** 한 개를 며칠에 걸쳐 쓰는지 */
  every: number;
};

export type Item = FoodItem | ConsumableItem;

export type ShopItem = {
  id: string;
  name: string;
  place: Place;
  by: string;
  checked: boolean;
};

/** 장 봐 온 뒤 재고에 넣기 전 '정리할 것' */
export type InboxItem = {
  id: string;
  name: string;
  place: Place;
  by: string;
  date: IsoDate;
};

export type MealEntry = {
  id: string;
  itemId: string;
  /** 먼저 꺼낼 로트 */
  lotId: string;
  /** 담은 양의 단위 ('팩' 또는 로트 단위) */
  label: string;
  qty: number;
  checked: boolean;
};

export type Task = {
  id: string;
  text: string;
  done: boolean;
};

export type Tone = 'orange' | 'blue' | 'green' | 'gray';

/** 설정 화면의 "우리 집 규칙" 중 계산에 쓰이는 값 */
export type Rules = {
  /** 기한이 이 일수 이하로 남으면 '먹을 것'으로 띄운다 */
  urgentDays: number;
  /** 냉장으로 옮긴(해동한) 것은 이 일수 안에 먹기로 잡는다 */
  chillDays: number;
  /** 냉동으로 옮기면 기한을 최소 이 일수로 늘린다 */
  freezeMinDays: number;
  /** 기한 없는 야채는 산 지 이 일수가 지나면 '오래 둔 것' */
  oldDays: number;
  /** 소모품이 이 일수 안에 떨어지면 '곧 떨어짐' */
  consSoonDays: number;
};

export const DEFAULT_RULES: Rules = {
  urgentDays: 3,
  chillDays: 2,
  freezeMinDays: 30,
  oldDays: 14,
  consSoonDays: 14,
};

/** 변경 연산에 공통으로 넘기는 맥락 */
export type Ctx = {
  today: IsoDate;
  /** 행동한 사람 (예: '나') */
  by: string;
  newId: () => string;
  rules?: Rules;
};

/** 변경 연산의 결과: 바뀐 데이터와 토스트 문구. 할 일이 없으면 null */
export type Change<T> = { next: T; message: string } | null;
