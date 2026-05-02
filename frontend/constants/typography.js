import { Platform } from 'react-native';

export const fontFamily = {
  regular: Platform.select({ ios: 'DMSans-Regular', android: 'DMSans-Regular', default: 'DMSans-Regular' }),
  medium: Platform.select({ ios: 'DMSans-Medium', android: 'DMSans-Medium', default: 'DMSans-Medium' }),
  bold: Platform.select({ ios: 'DMSans-Bold', android: 'DMSans-Bold', default: 'DMSans-Bold' }),
  displayRegular: Platform.select({ ios: 'Syne-Regular', android: 'Syne-Regular', default: 'Syne-Regular' }),
  displayBold: Platform.select({ ios: 'Syne-Bold', android: 'Syne-Bold', default: 'Syne-Bold' }),
  displayExtraBold: Platform.select({ ios: 'Syne-ExtraBold', android: 'Syne-ExtraBold', default: 'Syne-ExtraBold' }),
};

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 36,
  '4xl': 48,
};

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};
