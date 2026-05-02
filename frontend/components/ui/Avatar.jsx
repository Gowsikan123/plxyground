import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/spacing';
import { fontSize, fontFamily } from '../../constants/typography';

const SIZE_MAP = { sm: 32, md: 44, lg: 56, xl: 72 };

export function Avatar({ uri, name, size = 'md', style }) {
  const dim     = SIZE_MAP[size] || SIZE_MAP.md;
  const initials = name
    ? name.trim().split(' ').slice(0, 2).map(w => w[0].toUpperCase()).join('')
    : '?';

  return (
    <View style={[styles.container, { width: dim, height: dim, borderRadius: radius.full }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, { width: dim, height: dim, borderRadius: radius.full }]}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.initials, { fontSize: dim * 0.35 }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceElevated,
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
  },
  image:    { position: 'absolute', inset: 0 },
  initials: {
    color:      colors.textSecondary,
    fontFamily: fontFamily.syne.bold,
    fontWeight: '700',
  },
});
