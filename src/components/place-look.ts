import { useCallback } from 'react';

import { kindIcon, type IconName } from '@/components/icon';
import { kindOf, placeName, type PlaceKind, type StoragePlace } from '@/domain';
import { useHome } from '@/stores/home-store';
import { kindColors } from '@/theme';

/** 화면에 장소를 그릴 때 필요한 것: 이름, 종류, 색, 아이콘 */
export type PlaceLook = {
  id: string;
  name: string;
  kind: PlaceKind;
  fg: string;
  tint: string;
  icon: IconName;
};

export function lookOfKind(kind: PlaceKind) {
  return { ...kindColors[kind], icon: kindIcon(kind) };
}

export function lookOf(places: StoragePlace[], id: string): PlaceLook {
  const kind = kindOf(places, id);
  return { id, name: placeName(places, id), kind, ...lookOfKind(kind) };
}

/** 현재 보관 장소 목록 기준으로 id → 모양을 돌려주는 함수 */
export function usePlaceLook(): (id: string) => PlaceLook {
  const places = useHome((s) => s.places);
  return useCallback((id: string) => lookOf(places, id), [places]);
}
