import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

const Skeleton = React.memo(({ width = '100%', height = 16, borderRadius = 6, style }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const bg = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: ['#1E1E1E', '#2A2A2A'],
  });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: bg },
        style,
      ]}
    />
  );
});

Skeleton.displayName = 'Skeleton';
export default Skeleton;
