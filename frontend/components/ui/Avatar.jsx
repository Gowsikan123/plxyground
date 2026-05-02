import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { fontFamily, fontSize } from '../../constants/typography';

export function Avatar({ uri, name, size = 40, style }) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const textStyle = {
    color: colors.textSecondary,
    fontFamily: fontFamily.bold,
    fontSize: size * 0.36,
  };

  return (
    <View style={[containerStyle, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      ) : (
        <Text style={textStyle}>{initials}</Text>
      )}
    </View>
  );
}
