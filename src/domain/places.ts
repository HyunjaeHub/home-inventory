import type { InboxItem, Item, ShopItem } from './types';

/**
 * 보관 장소의 종류. 기한 규칙은 장소 이름이 아니라 종류로 판단한다.
 * (예: '김치냉장고'를 냉장 종류로 만들면 냉장 규칙을 그대로 따른다)
 */
export type PlaceKind = 'fridge' | 'freezer' | 'pantry' | 'home';

export type StoragePlace = {
  /** 재고·장보기가 가리키는 값. 이름을 바꿔도 그대로 */
  id: string;
  name: string;
  kind: PlaceKind;
};

export const PLACE_KINDS: { kind: PlaceKind; label: string; sub: string }[] = [
  { kind: 'fridge', label: '냉장', sub: '꺼낸 소분 팩은 정해진 날 안에 먹기' },
  { kind: 'freezer', label: '냉동', sub: '옮기면 기한을 늘려요' },
  { kind: 'pantry', label: '실온', sub: '처음엔 기한 없이 관리' },
  { kind: 'home', label: '생활용품', sub: '쓰는 속도로 관리하는 소모품' },
];

/** 기본 4곳. id를 예전 장소 이름과 같게 두어 기존 데이터가 그대로 맞는다 */
export const DEFAULT_PLACES: StoragePlace[] = [
  { id: '냉장', name: '냉장', kind: 'fridge' },
  { id: '냉동', name: '냉동', kind: 'freezer' },
  { id: '실온', name: '실온', kind: 'pantry' },
  { id: '생활', name: '생활', kind: 'home' },
];

const findPlace = (places: StoragePlace[], id: string) =>
  places.find((p) => p.id === id) ?? DEFAULT_PLACES.find((p) => p.id === id);

export function kindOf(places: StoragePlace[], id: string): PlaceKind {
  return findPlace(places, id)?.kind ?? 'pantry';
}

export function placeName(places: StoragePlace[], id: string): string {
  return findPlace(places, id)?.name ?? id;
}

/** 그 종류의 첫 장소 (예: 해동하면 들어갈 냉장 장소) */
export function firstOfKind(places: StoragePlace[], kind: PlaceKind): string {
  return places.find((p) => p.kind === kind)?.id ?? DEFAULT_PLACES.find((p) => p.kind === kind)!.id;
}

/** 해동·냉동 이동이 되는 장소인지 */
export function isColdKind(kind: PlaceKind): boolean {
  return kind === 'fridge' || kind === 'freezer';
}

/** 재고·장보기·정리할 것 중 이 장소를 쓰는 게 있는지 */
export function placeInUse(
  id: string,
  items: Item[],
  shop: ShopItem[],
  inbox: InboxItem[]
): boolean {
  return (
    items.some(
      (it) => it.place === id || (it.kind === 'food' && it.lots.some((l) => l.place === id))
    ) ||
    shop.some((s) => s.place === id) ||
    inbox.some((x) => x.place === id)
  );
}

/** 지울 수 없으면 그 이유. 종류마다 한 곳은 남겨야 규칙이 동작한다 */
export function removeBlocker(places: StoragePlace[], id: string, inUse: boolean): string | null {
  const p = places.find((x) => x.id === id);
  if (!p) return '없는 장소예요';
  if (inUse) return `${p.name}에 재고나 살 것이 있어서 지울 수 없어요`;
  if (places.filter((x) => x.kind === p.kind).length <= 1) {
    const label = PLACE_KINDS.find((k) => k.kind === p.kind)!.label;
    return `${label} 종류 장소는 한 곳 이상 있어야 해요`;
  }
  return null;
}

/** 이름 확인: 비었거나 이미 있으면 그 이유 */
export function nameProblem(
  places: StoragePlace[],
  name: string,
  exceptId?: string
): string | null {
  const n = name.trim();
  if (!n) return '이름을 입력해 주세요';
  if (places.some((p) => p.name === n && p.id !== exceptId)) return '같은 이름의 장소가 있어요';
  return null;
}
