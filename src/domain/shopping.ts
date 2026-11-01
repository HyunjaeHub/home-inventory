import { findByName } from './lots';
import { DEFAULT_PLACES, firstOfKind } from './places';
import type { Change, Ctx, InboxItem, Item, Place, ShopItem } from './types';

export function inShop(shop: ShopItem[], name: string): boolean {
  return shop.some((s) => s.name === name);
}

/** 살 것에 담기. 장소를 안 주면 재고의 기본 장소, 그것도 없으면 실온 */
export function addToShop(
  shop: ShopItem[],
  items: Item[],
  name: string,
  ctx: Ctx,
  place?: Place
): Change<ShopItem[]> {
  const n = name.trim();
  if (!n) return null;
  if (inShop(shop, n)) return { next: shop, message: `${n}은(는) 이미 살 것에 있어요` };
  const p =
    place ?? findByName(items, n)?.place ?? firstOfKind(ctx.places ?? DEFAULT_PLACES, 'pantry');
  return {
    next: [...shop, { id: ctx.newId(), name: n, place: p, by: ctx.by, checked: false }],
    message: `${n} 살 것에 담았어요`,
  };
}

export function toggleShop(shop: ShopItem[], id: string): ShopItem[] {
  return shop.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s));
}

export function removeShop(shop: ShopItem[], id: string): ShopItem[] {
  return shop.filter((s) => s.id !== id);
}

/** 아직 안 산(체크 안 된) 같은 이름 항목 빼기 */
export function removeShopByName(shop: ShopItem[], name: string): ShopItem[] {
  return shop.filter((s) => s.name !== name || s.checked);
}

/** 장보기 완료: 체크한 것을 '정리할 것'으로 옮긴다 */
export function completeShop(
  shop: ShopItem[],
  inbox: InboxItem[],
  ctx: Ctx
): Change<{ shop: ShopItem[]; inbox: InboxItem[] }> {
  const done = shop.filter((s) => s.checked);
  if (!done.length) return null;
  const added = done.map((s) => ({
    id: ctx.newId(),
    name: s.name,
    place: s.place,
    by: s.by,
    date: ctx.today,
  }));
  return {
    next: { shop: shop.filter((s) => !s.checked), inbox: [...inbox, ...added] },
    message: `${done.length}개를 정리할 것으로 옮겼어요`,
  };
}
