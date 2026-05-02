import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/spacing';

export function Skeleton({ width, height, style, borderRadius }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900,  useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900,  useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius: borderRadius ?? radius.sm, opacity },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceElevated,
  },
});
