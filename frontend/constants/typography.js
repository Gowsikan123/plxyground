import { Platform } from 'react-native';

export const fontFamily = {
  syne: {
    regular:     'Syne_400Regular',
    medium:      'Syne_500Medium',
    semiBold:    'Syne_600SemiBold',
    bold:        'Syne_700Bold',
    extraBold:   'Syne_800ExtraBold',
  },
  dmSans: {
    regular:     'DMSans_400Regular',
    medium:      'DMSans_500Medium',
    semiBold:    'DMSans_600SemiBold',
    bold:        'DMSans_700Bold',
  },
  system: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
};

export const fontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   19,
  xl:   22,
  '2xl': 26,
  '3xl': 32,
  display: 40,
};

export const lineHeight = {
  tight:   1.2,
  normal:  1.5,
  relaxed: 1.7,
};

export const fontWeight = {
  regular:  '400',
  medium:   '500',
  semiBold: '600',
  bold:     '700',
  extraBold:'800',
};
