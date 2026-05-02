import { Platform } from 'react-native';

export const fontFamily = {
  syne:     'Syne_700Bold',
  dmSans:   'DMSans_400Regular',
  dmSansMd: 'DMSans_500Medium',
  dmSansBd: 'DMSans_700Bold',
};

export const fontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  xxl:  30,
  hero: 38,
};

export const lineHeight = {
  tight:  1.2,
  normal: 1.5,
  loose:  1.8,
};

export const typography = {
  hero: {
    fontFamily: fontFamily.syne,
    fontSize:   fontSize.hero,
    color:      '#FFFFFF',
    lineHeight: fontSize.hero * lineHeight.tight,
  },
  h1: {
    fontFamily: fontFamily.syne,
    fontSize:   fontSize.xxl,
    color:      '#FFFFFF',
    lineHeight: fontSize.xxl * lineHeight.tight,
  },
  h2: {
    fontFamily: fontFamily.syne,
    fontSize:   fontSize.xl,
    color:      '#FFFFFF',
    lineHeight: fontSize.xl * lineHeight.tight,
  },
  h3: {
    fontFamily: fontFamily.dmSansBd,
    fontSize:   fontSize.lg,
    color:      '#FFFFFF',
    lineHeight: fontSize.lg * lineHeight.normal,
  },
  body: {
    fontFamily: fontFamily.dmSans,
    fontSize:   fontSize.base,
    color:      '#FFFFFF',
    lineHeight: fontSize.base * lineHeight.normal,
  },
  bodyMd: {
    fontFamily: fontFamily.dmSansMd,
    fontSize:   fontSize.base,
    color:      '#FFFFFF',
    lineHeight: fontSize.base * lineHeight.normal,
  },
  caption: {
    fontFamily: fontFamily.dmSans,
    fontSize:   fontSize.sm,
    color:      '#8A8A8A',
    lineHeight: fontSize.sm * lineHeight.normal,
  },
  label: {
    fontFamily: fontFamily.dmSansMd,
    fontSize:   fontSize.xs,
    color:      '#8A8A8A',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  button: {
    fontFamily: fontFamily.dmSansBd,
    fontSize:   fontSize.base,
    color:      '#FFFFFF',
    letterSpacing: 0.3,
  },
};
