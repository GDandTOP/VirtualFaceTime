// ── 색상 팔레트 (기존 민트 계열 유지) ──
export const Colors = {
  // 메인 컬러 (민트 계열)
  primary: '#4ECDC4',
  primaryLight: '#E8F8F5',
  primaryDark: '#2DB5AB',
  primarySubtle: '#F0FAF8',

  // 배경
  background: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // 텍스트
  text: '#1A1D26',
  textSecondary: '#5E6272',
  textTertiary: '#9DA3B0',
  textOnPrimary: '#FFFFFF',

  // 기본 색상
  white: '#FFFFFF',
  black: '#000000',

  // 보더 / 구분선
  border: '#ECEDF0',
  borderLight: '#F2F3F5',
  divider: '#F0F1F3',

  // 상태 색상
  danger: '#FF4757',
  dangerLight: '#FFF0F0',
  success: '#2ED573',
  warning: '#FFA502',

  // 영상통화 전용 (다크 톤)
  darkBg: '#0F0F1A',
  darkSurface: '#1A1A2E',
  darkOverlay: 'rgba(0, 0, 0, 0.55)',
  glassLight: 'rgba(255, 255, 255, 0.12)',
  glassMedium: 'rgba(255, 255, 255, 0.22)',
};

// ── 타이포그래피 ──
export const Typography = {
  h1: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.6, lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.4, lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '600' as const, letterSpacing: -0.2, lineHeight: 26 },
  body: { fontSize: 15, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 22 },
  bodyMedium: { fontSize: 15, fontWeight: '500' as const, letterSpacing: 0, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400' as const, letterSpacing: 0.1, lineHeight: 18 },
  captionMedium: { fontSize: 13, fontWeight: '500' as const, letterSpacing: 0.1, lineHeight: 18 },
  small: { fontSize: 11, fontWeight: '400' as const, letterSpacing: 0.2, lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '600' as const, letterSpacing: 0.2, lineHeight: 22 },
  buttonSmall: { fontSize: 14, fontWeight: '600' as const, letterSpacing: 0.1, lineHeight: 20 },
};

// ── 간격 ──
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};

// ── 모서리 둥글기 ──
export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 9999,
};

// ── 그림자 프리셋 ──
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  primary: {
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  danger: {
    shadowColor: '#FF4757',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};
