// Central design tokens — import this everywhere instead of hardcoding colours
export const C = {
  bg:         '#07080F',
  surface:    '#0D1018',
  surface2:   '#121520',
  border:     '#1C2030',
  borderSoft: '#151926',

  text:       '#F0F2F8',
  textMuted:  '#5A6278',
  textFaint:  '#2E3347',

  accent:     '#4F7EFF',
  accentDark: '#1E3A8A',
  accentGlow: 'rgba(79,126,255,0.15)',

  green:      '#22C55E',
  greenDark:  '#14532D',
  greenGlow:  'rgba(34,197,94,0.12)',

  purple:     '#A78BFA',
  purpleDark: '#3B0764',
  purpleGlow: 'rgba(167,139,250,0.12)',

  red:        '#F87171',
  redDark:    '#450A0A',

  gold:       '#FBBF24',

  article:    { bg: '#0E1835', text: '#4F7EFF',  label: 'Article' },
  video:      { bg: '#160E2E', text: '#A78BFA',  label: 'Video'   },
  story:      { bg: '#0A1E16', text: '#22C55E',  label: 'Story'   },
};

export const R = {
  xs:   6,
  sm:   10,
  md:   14,
  lg:   18,
  xl:   24,
  full: 999,
};

export const S = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
  '3xl': 48,
};

export const GRAD_ACCENT  = ['#4F7EFF', '#2563EB'];
export const GRAD_GREEN   = ['#22C55E', '#16A34A'];
export const GRAD_PURPLE  = ['#A78BFA', '#7C3AED'];
export const GRAD_SURFACE = ['#0D1018', '#07080F'];
export const GRAD_CARD    = ['transparent', 'rgba(7,8,15,0.9)'];
