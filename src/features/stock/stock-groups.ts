import {
  consBadge,
  consDays,
  foodSummary,
  lotAge,
  lotsOf,
  DEFAULT_PLACES,
  totalText,
  type IsoDate,
  type Item,
  type Place,
  type StoragePlace,
  type Tone,
} from '@/domain';

/** '전체' 또는 장소 id */
export type StockFilter = '전체' | Place;

export function stockFilters(places: StoragePlace[]): StockFilter[] {
  return ['전체', ...places.map((p) => p.id)];
}

export type StockRow = {
  itemId: string;
  name: string;
  sub: string;
  badge: string;
  tone: Tone;
  /** 정렬 키: 급한 것이 작다 */
  key: number;
  /** 한끼에 담을 때 먼저 꺼낼 로트. 식품이 아니거나 다 먹었으면 null */
  firstLotId: string | null;
  isFood: boolean;
};

export type StockGroup = { place: Place; rows: StockRow[] };

/** 식품은 로트가 있는 장소마다, 소모품은 자기 장소에 나온다 */
function inPlace(item: Item, place: StockFilter, today: IsoDate): boolean {
  if (item.kind === 'cons') return place === '전체' || item.place === place;
  return place === '전체' ? lotsOf(item, today).length > 0 : lotsOf(item, today, place).length > 0;
}

export function filterCounts(
  items: Item[],
  today: IsoDate,
  places: StoragePlace[] = DEFAULT_PLACES
): Record<StockFilter, number> {
  const out = {} as Record<StockFilter, number>;
  for (const f of stockFilters(places)) {
    out[f] = items.filter((it) => inPlace(it, f, today)).length;
  }
  return out;
}

/** 재고 목록: 장소별 묶음(설정의 장소 순서), 묶음 안은 급한 순 */
export function stockGroups(
  items: Item[],
  today: IsoDate,
  filter: StockFilter,
  query: string,
  places: StoragePlace[] = DEFAULT_PLACES
): StockGroup[] {
  const q = query.trim();
  return places
    .map((p) => p.id)
    .filter((p) => filter === '전체' || filter === p)
    .map((place) => {
      const rows: StockRow[] = [];
      for (const it of items) {
        if (q && !it.name.includes(q)) continue;
        if (it.kind === 'food') {
          const lots = lotsOf(it, today, place);
          // 다 먹은 식품은 기본 장소에만 남겨 둔다
          if (!lots.length && !(lotsOf(it, today).length === 0 && it.place === place)) continue;
          const sm = foodSummary(it, today, place);
          const expCount = new Set(lots.map((l) => l.exp).filter(Boolean)).size;
          let sub = lots.length ? totalText(lots) : '다 먹음';
          if (expCount > 1) sub += ` · 기한 ${expCount}가지`;
          else if (lots.length && !lots[0].exp) sub += ' · 기한 없음';
          // 기한 있는 건 남은 일수, 기한 없는 건 오래된 것이 앞, 다 먹은 건 맨 뒤
          const key = !sm.first ? 99999 : (sm.days ?? 9000 - lotAge(sm.first, today));
          rows.push({
            itemId: it.id,
            name: it.name,
            sub,
            badge: sm.badge,
            tone: sm.tone,
            key,
            firstLotId: lots[0]?.id ?? null,
            isFood: true,
          });
        } else if (it.place === place) {
          const b = consBadge(it, today);
          rows.push({
            itemId: it.id,
            name: it.name,
            sub: `${it.qty}${it.unit} 남음 · 약 ${consDays(it)}일`,
            badge: b.text,
            tone: b.tone,
            key: consDays(it),
            firstLotId: null,
            isFood: false,
          });
        }
      }
      rows.sort((a, b) => a.key - b.key);
      return { place, rows };
    })
    .filter((g) => g.rows.length > 0);
}
