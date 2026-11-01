/**
 * 디자인 토큰 — 「집 재고관리 화면 시안」(Main.dc.html)에서 추출.
 * 시안은 라이트 모드만 있으므로 다크 모드는 아직 정의하지 않는다.
 */

export const colors = {
  /** 화면 바탕 */
  background: '#F1F1F5',
  /** 카드·탭 바 */
  surface: '#FFFFFF',
  /** 본문 텍스트 */
  text: '#16191C',
  /** 제목 텍스트 */
  heading: '#1E2328',
  /** 보조 텍스트 */
  textSecondary: '#5B636B',
  /** 더 약한 보조 텍스트 (요일, 비활성 탭) */
  textMuted: '#6B6F80',
  /** 링크성 버튼 텍스트 */
  link: '#4F5363',
  /** 구분선·테두리 */
  border: '#E3E5E2',
  /** 비활성 테두리 (체크박스 등) */
  borderStrong: '#8C939A',
  /** 활성 탭 배경 */
  tabActive: '#E4E6EC',
  /** 토스트 배경 */
  toast: '#16191C',
  /** 한끼 배지 */
  accentGreen: '#2E8B63',
  /** 장보기 배지 */
  accentBlue: '#1F4FB8',
  /** 기한 임박 글자 */
  danger: '#B4380F',
  /** 목록 행 사이 구분 */
  divider: '#EEEEF3',
  /** 연한 버튼 바탕 */
  muted: '#F1F1F5',
  /** 버튼 글자 (연한 바탕 위) */
  mutedText: '#3F464C',
  /** 꺼진 버튼 */
  disabled: '#A9AEB3',
  /** 소모품 카드 */
  consCard: '#DCD7FF',
  consBar: '#4B3FB0',
} as const;

/** 배지 톤 — 시안의 tone(): 기한 임박(orange) / 소모품(blue) / 여유(green) / 기본(gray) */
export const tones = {
  orange: { bg: '#FDEBDD', fg: '#A3410A' },
  blue: { bg: '#E4ECFB', fg: '#1F4FB8' },
  green: { bg: '#E3F0E8', fg: '#2E6B4F' },
  gray: { bg: '#EEF0EE', fg: '#4C545B' },
} as const;

export type Tone = keyof typeof tones;

/** 보관 장소 종류별 색: fg는 글자·아이콘, tint는 묶음 카드 바탕 */
export const kindColors = {
  fridge: { fg: '#2F6F73', tint: '#E1EFEE' },
  freezer: { fg: '#4057A8', tint: '#E7EBF8' },
  pantry: { fg: '#86651A', tint: '#F4ECD6' },
  home: { fg: '#5D6168', tint: '#E6E7EA' },
} as const;

export const radius = {
  sm: 9,
  md: 12,
  lg: 16,
  xl: 20,
  card: 24,
  pill: 999,
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

/** 제목은 Jua, 본문은 시스템 폰트(iOS: Apple SD Gothic Neo — 시안의 Noto Sans KR과 유사) */
export const fonts = {
  display: 'Jua_400Regular',
} as const;

export const fontSize = {
  caption: 11,
  small: 12,
  body: 14,
  bodyLarge: 15,
  sectionTitle: 17,
  title: 30,
} as const;
