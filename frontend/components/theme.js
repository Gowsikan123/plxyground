// ─── PLXYGROUND DESIGN TOKENS v3 ───────────────────────────────────────────
// Energetic · Colourful · Young Creative · Sports Creator Network

export const C = {
  // Canvas — warm dark undertone (more creative, less cold-techy)
  bg:          '#0C0A12',
  surface:     '#12101A',
  surface2:    '#181622',
  surface3:    '#1E1B2C',
  border:      'rgba(255,255,255,0.07)',
  borderBright:'rgba(255,255,255,0.14)',

  // Text — improved contrast for legibility at small sizes
  text:        '#FFFFFF',
  textMuted:   '#9C98B8',
  textFaint:   '#4A4665',

  // PRIMARY accent — electric coral
  accent:      '#FF4D6D',
  accentAlt:   '#FF2D52',
  accentGlow:  'rgba(255,77,109,0.22)',
  accentDark:  'rgba(255,77,109,0.12)',

  // SECONDARY — neon lime
  lime:        '#AAFF00',
  limeGlow:    'rgba(170,255,0,0.18)',
  limeDark:    'rgba(170,255,0,0.08)',

  // TERTIARY — electric cyan
  cyan:        '#00D4FF',
  cyanGlow:    'rgba(0,212,255,0.18)',
  cyanDark:    'rgba(0,212,255,0.08)',

  // QUATERNARY — electric purple
  purple:      '#BF5FFF',
  purpleGlow:  'rgba(191,95,255,0.18)',
  purpleDark:  'rgba(191,95,255,0.08)',

  // QUINARY — warm amber (badges, streaks, "hot" content)
  amber:       '#FFAB00',
  amberGlow:   'rgba(255,171,0,0.18)',
  amberDark:   'rgba(255,171,0,0.08)',

  // Semantic
  green:       '#22C55E',
  greenGlow:   'rgba(34,197,94,0.15)',
  greenDark:   'rgba(34,197,94,0.08)',
  red:         '#FF4444',
  redDark:     'rgba(255,68,68,0.12)',
  gold:        '#FFD700',

  // Content type tokens
  article:     { bg: 'rgba(0,212,255,0.10)',   text: '#00D4FF',  label: 'Article'   },
  video:       { bg: 'rgba(191,95,255,0.10)',  text: '#BF5FFF',  label: 'Video'     },
  story:       { bg: 'rgba(170,255,0,0.10)',   text: '#AAFF00',  label: 'Story'     },
  hot:         { bg: 'rgba(255,171,0,0.10)',   text: '#FFAB00',  label: 'Hot'       },
};

export const R = {
  xs:   6,
  sm:   10,
  md:   14,
  lg:   18,
  xl:   24,
  xxl:  32,
  full: 999,
};

export const S = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  xxl:  32,
  '3xl':48,
};

// Gradients
export const GRAD_ACCENT   = ['#FF4D6D', '#FF2052'];
export const GRAD_LIME     = ['#AAFF00', '#7DCC00'];
export const GRAD_CYAN     = ['#00D4FF', '#0099CC'];
export const GRAD_PURPLE   = ['#BF5FFF', '#8B2FCC'];
export const GRAD_AMBER    = ['#FFAB00', '#FF7A00'];
export const GRAD_HERO     = ['#FF4D6D', '#D44FFF', '#3B8BFF'];  // coral → purple → blue
export const GRAD_SURFACE  = ['#12101A', '#0C0A12'];
export const GRAD_CARD     = ['transparent', 'rgba(12,10,18,0.95)'];
export const GRAD_SHIMMER  = ['#12101A', '#1E1B2C', '#12101A'];
