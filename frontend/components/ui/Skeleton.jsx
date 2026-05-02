import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../../constants/colors';
import { borderRadius } from '../../constants/spacing';

export const Skeleton = React.memo(({ width, height, style, borderRadius: br }) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius: br ?? borderRadius.sm, opacity },
        style,
      ]}
    />
  );
});

export const SkeletonCard = () => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Skeleton width={40} height={40} borderRadius={borderRadius.full} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width="70%" height={13} />
        <Skeleton width="45%" height={11} />
      </View>
    </View>
    <Skeleton width="100%" height={14} style={{ marginBottom: 6 }} />
    <Skeleton width="80%"  height={14} style={{ marginBottom: 12 }} />
    <Skeleton width="100%" height={160} borderRadius={borderRadius.md} />
  </View>
);

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceElevated,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
});
