import Svg, { Circle, Path } from 'react-native-svg';

export type TabIconName = 'home' | 'stock' | 'meal' | 'shopping' | 'settings';

type Props = {
  name: TabIconName;
  color: string;
  size?: number;
};

/** 시안 하단 탭의 선 아이콘 (24×24, stroke 2) */
export function TabIcon({ name, color, size = 22 }: Props) {
  return (
    <Svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round">
      {name === 'home' && <Path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />}
      {name === 'stock' && (
        <>
          <Path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
          <Path d="M3 7l9 4 9-4M12 11v10" />
        </>
      )}
      {name === 'meal' && (
        <>
          <Path d="M3 12h18a9 9 0 0 1-18 0z" />
          <Path d="M9 3c-1 1.5 1 2.5 0 4M14 3c-1 1.5 1 2.5 0 4" />
        </>
      )}
      {name === 'shopping' && (
        <>
          <Path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6" />
          <Circle cx={9} cy={20} r={1.5} />
          <Circle cx={17} cy={20} r={1.5} />
        </>
      )}
      {name === 'settings' && (
        <>
          <Path d="M4 6h8M18 6h2M4 12h2M12 12h8M4 18h10" />
          <Circle cx={15} cy={6} r={2.5} />
          <Circle cx={9} cy={12} r={2.5} />
          <Circle cx={17} cy={18} r={2.5} />
        </>
      )}
    </Svg>
  );
}
