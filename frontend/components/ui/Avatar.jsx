import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius } from '../../constants/spacing';

export function Avatar({ uri, name = '?', size = 40 }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return uri ? (
    <Image source={{ uri }} style={[styles.img, { width: size, height: size, borderRadius: size / 2 }]} />
  ) : (
    <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  img: { backgroundColor: Colors.surfaceHigh },
  placeholder: { backgroundColor: Colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: Typography.fontBodyBold, color: Colors.accent },
});
