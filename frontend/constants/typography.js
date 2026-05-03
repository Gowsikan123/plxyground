export const Typography = {
  fontDisplay: 'Syne_700Bold',
  fontBody: 'DMSans_400Regular',
  fontBodyMedium: 'DMSans_500Medium',
  fontBodyBold: 'DMSans_700Bold',
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 18,
    xl: 22,
    '2xl': 28,
    '3xl': 36,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};

// Uppercase alias with flat spec shape used by auth screens
export const TYPOGRAPHY = {
  ...Typography,
  displayLg: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizes['3xl'],
    lineHeight: Math.round(Typography.sizes['3xl'] * 1.2),
  },
  displaySm: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizes['2xl'],
    lineHeight: Math.round(Typography.sizes['2xl'] * 1.2),
  },
  bodyMd: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.base,
    lineHeight: Math.round(Typography.sizes.base * 1.5),
  },
  bodySm: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.sm,
    lineHeight: Math.round(Typography.sizes.sm * 1.5),
  },
  labelLg: {
    fontFamily: Typography.fontBodyBold,
    fontSize: Typography.sizes.base,
    lineHeight: Math.round(Typography.sizes.base * 1.4),
  },
  labelSm: {
    fontFamily: Typography.fontBodyBold,
    fontSize: Typography.sizes.sm,
    lineHeight: Math.round(Typography.sizes.sm * 1.4),
  },
};
