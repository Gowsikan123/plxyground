import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors }  from '../../constants/colors';
import { borderRadius } from '../../constants/spacing';

export const Skeleton = React.memo(function Skeleton({ width, height = 14, radius, style }) {
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

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  return (
    <Animated.View
      style={[
        styles.base,
        {
          width:        width  ?? '100%',
          height,
          borderRadius: radius ?? borderRadius.md,
          opacity,
        },
        style,
      ]}
    />
  );
});

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceElevated,
  },
});
