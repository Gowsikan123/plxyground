// ─── PLXYGROUND DESIGN TOKENS v4 ────────────────────────────────────────────────────────
// Direction: Clean · Premium · Sports Network · One accent, no rainbow
// Reference: early Twitter, Fanatics, ESPN app dark mode

export const C = {
  // ─ Canvas ──────────────────────────────────────────────────────
  // True neutral dark — no purple tint
  bg:           '#0A0A0A',
  surface:      '#111111',
  surface2:     '#1A1A1A',
  surface3:     '#222222',
  border:       'rgba(255,255,255,0.06)',
  borderBright: 'rgba(255,255,255,0.12)',

  // ─ Text ───────────────────────────────────────────────────────
  text:         '#F5F5F5',
  textMuted:    '#888888',
  textFaint:    '#444444',

  // ─ PRIMARY accent — electric orange ──────────────────────────────
  // Single accent. Used on CTAs, active tabs, highlights only.
  accent:       '#FF6B00',
  accentAlt:    '#FF8C00',
  accentGlow:   'rgba(255,107,0,0.18)',
  accentDim:    'rgba(255,107,0,0.10)',
  accentDark:   'rgba(255,107,0,0.07)',

  // ─ Semantic ────────────────────────────────────────────────
  success:      '#22C55E',
  successDark:  'rgba(34,197,94,0.10)',
  error:        '#EF4444',
  errorDark:    'rgba(239,68,68,0.10)',
  warning:      '#F59E0B',
  warningDark:  'rgba(245,158,11,0.10)',
  gold:         '#F59E0B',

  // ─ Content type tokens (monochrome labels, accent highlights) ───────
  article:  { bg: 'rgba(255,255,255,0.06)', text: '#AAAAAA', label: 'Article'   },
  video:    { bg: 'rgba(255,107,0,0.10)',   text: '#FF8C00', label: 'Video'     },
  story:    { bg: 'rgba(255,255,255,0.06)', text: '#AAAAAA', label: 'Story'     },
  hot:      { bg: 'rgba(255,107,0,0.14)',   text: '#FF6B00', label: 'Hot'       },
};

export const R = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  28,
  full: 999,
};

export const S = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  xxl:  32,
  '3xl': 48,
};

// ─ Gradients ───────────────────────────────────────────────────
// All gradients are monochrome or single-accent.
// No multi-colour rainbow gradients anywhere in the app.
export const GRAD_ACCENT   = ['#FF6B00', '#FF4500'];       // orange CTA buttons
export const GRAD_HERO     = ['#FF6B00', '#FF4500'];       // hero header (was coral+purple+blue)
export const GRAD_SURFACE  = ['#111111', '#0A0A0A'];       // card/screen fades
export const GRAD_CARD     = ['transparent', 'rgba(10,10,10,0.96)'];
export const GRAD_SHIMMER  = ['#111111', '#1A1A1A', '#111111'];

// Kept for any legacy references — all redirect to neutral/accent
export const GRAD_LIME     = ['#FF6B00', '#FF4500'];
export const GRAD_CYAN     = ['#FF6B00', '#FF4500'];
export const GRAD_PURPLE   = ['#FF6B00', '#FF4500'];
export const GRAD_AMBER    = ['#FF6B00', '#FF4500'];
