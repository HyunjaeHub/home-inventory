import type { ReactNode } from 'react';
import { Platform } from 'react-native';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';

/** 아이폰 홈 화면에 추가해서 연 웹앱인지 (Safari 안에서 연 것과 구분) */
export const isHomeScreenWebApp =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  ((navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia?.('(display-mode: standalone)').matches === true);

/** 상태 막대 아래 iOS가 흐리게 덮는 띠를 피하려고 더 띄우는 높이 */
const TOP_FADE = 16;
/** 홈 바(화면 아래 가로 막대) 자리. 브라우저가 안전 영역을 0으로 알려 줄 때 대신 쓴다 */
const HOME_INDICATOR = 20;

/**
 * 홈 화면 웹앱 보정.
 * Safari에서는 위아래에 Safari 막대가 있어 문제없지만, 홈 화면 웹앱은 화면 끝까지 쓰는데
 * - 아래: 안전 영역이 0으로 와서 탭 바가 홈 바에 붙는다
 * - 위: 상태 막대 아래 흐린 띠에 제목이 걸친다
 * 모든 화면이 안전 영역 값을 이 컨텍스트에서 읽으므로 여기서 한 번에 고친다.
 */
export function WebAppInsets({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  if (!isHomeScreenWebApp) return children;
  return (
    <SafeAreaInsetsContext.Provider
      value={{
        ...insets,
        top: insets.top + TOP_FADE,
        bottom: Math.max(insets.bottom, HOME_INDICATOR),
      }}>
      {children}
    </SafeAreaInsetsContext.Provider>
  );
}
