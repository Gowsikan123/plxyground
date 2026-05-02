import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { borderRadius } from '../../constants/spacing';

export const Avatar = React.memo(({ uri, name, size = 40, style }) => {
  const [error, setError] = useState(false);

  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  if (uri && !error) {
    return (
      <Image
        source={{ uri }}
        style={[styles.img, { width: size, height: size, borderRadius: size / 2 }, style]}
        onError={() => setError(true)}
        accessibilityLabel={name ? `${name} avatar` : 'Avatar'}
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  img: {
    backgroundColor: colors.surfaceElevated,
  },
  fallback: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    fontWeight: '700',
  },
});
