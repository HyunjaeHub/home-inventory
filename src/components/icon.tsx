import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { Place } from '@/domain';

/** 시안에서 쓰는 선 아이콘 (24×24 viewBox) */
const ICONS = {
  home: <Path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  stock: (
    <>
      <Path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
      <Path d="M3 7l9 4 9-4M12 11v10" />
    </>
  ),
  meal: (
    <>
      <Path d="M3 12h18a9 9 0 0 1-18 0z" />
      <Path d="M9 3c-1 1.5 1 2.5 0 4M14 3c-1 1.5 1 2.5 0 4" />
    </>
  ),
  shopping: (
    <>
      <Path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6" />
      <Circle cx={9} cy={20} r={1.5} />
      <Circle cx={17} cy={20} r={1.5} />
    </>
  ),
  settings: (
    <>
      <Path d="M4 6h8M18 6h2M4 12h2M12 12h8M4 18h10" />
      <Circle cx={15} cy={6} r={2.5} />
      <Circle cx={9} cy={12} r={2.5} />
      <Circle cx={17} cy={18} r={2.5} />
    </>
  ),
  fridge: (
    <>
      <Rect x={6} y={3} width={12} height={18} rx={2} />
      <Path d="M6 10h12M9 6v2M9 13v3" />
    </>
  ),
  freezer: <Path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" />,
  pantry: <Path d="M4 8h16M5 8l1 12h12l1-12M9 8V5h6v3" />,
  chevronDown: <Path d="M6 9l6 6 6-6" />,
  chevronUp: <Path d="M6 15l6-6 6 6" />,
  back: <Path d="M15 5l-7 7 7 7" />,
  check: <Path d="M5 12l4.5 4.5L19 7" />,
  plus: <Path d="M12 5v14M5 12h14" />,
  minus: <Path d="M5 12h14" />,
  search: (
    <>
      <Circle cx={11} cy={11} r={7} />
      <Path d="M20 20l-3.5-3.5" />
    </>
  ),
  sort: <Path d="M4 6h16M7 12h10M10 18h4" />,
  bowl: (
    <>
      <Path d="M4 11h16a8 8 0 0 1-16 0z" />
      <Path d="M9 4v3M12 3v4M15 4v3" />
    </>
  ),
  edit: <Path d="M4 20h4L19 9l-4-4L4 16z" />,
  split: (
    <>
      <Path d="M12 3v18" />
      <Path d="M7 8l-3 4 3 4M17 8l3 4-3 4" />
    </>
  ),
  move: <Path d="M7 7h11l-3-3M17 17H6l3 3" />,
} as const;

export type IconName = keyof typeof ICONS;

type Props = {
  name: IconName;
  color: string;
  size?: number;
  strokeWidth?: number;
};

export function Icon({ name, color, size = 20, strokeWidth = 2 }: Props) {
  return (
    <Svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      {ICONS[name]}
    </Svg>
  );
}

const PLACE_ICONS: Record<Place, IconName> = {
  냉장: 'fridge',
  냉동: 'freezer',
  실온: 'pantry',
  생활: 'home',
};

export function placeIcon(place: Place): IconName {
  return PLACE_ICONS[place];
}
