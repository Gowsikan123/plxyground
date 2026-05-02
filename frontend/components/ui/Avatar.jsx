import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { fontFamilies, fontSizes } from '../../constants/typography';

const SIZES = { sm: 32, md: 44, lg: 64, xl: 96 };
const BG_COLORS = ['#C0392B', '#2980B9', '#8E44AD', '#27AE60', '#E67E22', '#16A085'];

function colorFor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return BG_COLORS[hash % BG_COLORS.length];
}

const Avatar = React.memo(({ uri, name = '', size = 'md', style }) => {
  const dim = SIZES[size] || SIZES.md;
  const initials = (name || '?')
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  const textSize = dim < 40 ? fontSizes.xs : dim < 60 ? fontSizes.sm : fontSizes.md;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[{ width: dim, height: dim, borderRadius: dim / 2 }, style]}
      />
    );
  }
  return (
    <View
      style={[
        { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: colorFor(name), alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      <Text style={{ fontFamily: fontFamilies.bodyMedium, fontSize: textSize, color: colors.white }}>
        {initials}
      </Text>
    </View>
  );
});

Avatar.displayName = 'Avatar';
export default Avatar;
