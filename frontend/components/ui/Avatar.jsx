import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors }   from '../../constants/colors';
import { fontSize } from '../../constants/typography';
import { borderRadius } from '../../constants/spacing';

const SIZE_MAP = { xs: 24, sm: 32, md: 40, lg: 56, xl: 72 };

export const Avatar = React.memo(function Avatar({ uri, name, size = 'md', style }) {
  const dim = SIZE_MAP[size] || SIZE_MAP.md;
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <View style={[styles.base, { width: dim, height: dim, borderRadius: dim / 2 }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: dim, height: dim, borderRadius: dim / 2 }}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.initials, { fontSize: dim * 0.35 }]}>{initials}</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceElevated,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     colors.border,
  },
  initials: {
    color:      colors.textSecondary,
    fontFamily: 'Syne_700Bold',
  },
});
