// Design tokens: the single source for colour, spacing, radius and type.
// Dark, high-contrast palette carried over from the original PLXYGROUND look.

export const colors = {
  background: '#0A0A0A',
  surface: '#141414',
  surfaceRaised: '#1E1E1E',
  border: '#2A2A2A',
  text: '#F5F5F5',
  textMuted: '#A3A3A3',
  accent: '#FF5A1F',
  accentText: '#0A0A0A',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const type = {
  title: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  heading: { fontSize: 20, fontWeight: '700' as const, lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  label: { fontSize: 14, fontWeight: '600' as const, lineHeight: 18 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
} as const;

// Minimum touch target recommended by Apple's Human Interface Guidelines.
export const minTouchSize = 44;
