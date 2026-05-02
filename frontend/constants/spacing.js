// PLXYGROUND — Design token: Spacing (4px base unit)
export const Spacing = {
  0:   0,
  0.5: 2,
  1:   4,
  1.5: 6,
  2:   8,
  2.5: 10,
  3:   12,
  3.5: 14,
  4:   16,
  5:   20,
  6:   24,
  7:   28,
  8:   32,
  9:   36,
  10:  40,
  11:  44,
  12:  48,
  14:  56,
  16:  64,
  20:  80,
  24:  96,
  32:  128,
};

// Named aliases
export const S = {
  xs:   Spacing[1],   // 4
  sm:   Spacing[2],   // 8
  md:   Spacing[4],   // 16
  lg:   Spacing[6],   // 24
  xl:   Spacing[8],   // 32
  '2xl':Spacing[12],  // 48
  '3xl':Spacing[16],  // 64
  screenPad: Spacing[4],  // horizontal screen padding
  cardPad:   Spacing[4],
  sectionGap:Spacing[6],
  tabBarHeight: 56,
  headerHeight: 56,
  inputHeight:  48,
  buttonHeight: 48,
  avatarSm: 32,
  avatarMd: 40,
  avatarLg: 64,
  avatarXl: 96,
};

export default Spacing;
