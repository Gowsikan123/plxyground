import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View, type DimensionValue } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';

/** Grey placeholder block that gently pulses (or stays still if Reduce Motion is on). */
export function SkeletonBlock({ width = '100%', height = 14, round }: { width?: DimensionValue; height?: number; round?: boolean }) {
  const opacity = useRef(new Animated.Value(0.5)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reduceMotion]);

  return (
    <Animated.View
      style={{
        width, height, opacity,
        borderRadius: round ? height / 2 : radius.sm,
        backgroundColor: colors.surfaceRaised,
      }}
    />
  );
}

/** A list of placeholder cards shown while the first page loads. */
export function SkeletonList({ count = 4, withMedia }: { count?: number; withMedia?: boolean }) {
  return (
    <View style={styles.list} accessibilityRole="progressbar" accessibilityLabel="Loading">
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.row}>
            <SkeletonBlock width={32} height={32} round />
            <SkeletonBlock width="40%" />
          </View>
          {withMedia ? <SkeletonBlock height={180} /> : null}
          <SkeletonBlock width="70%" height={20} />
          <SkeletonBlock />
          <SkeletonBlock width="85%" />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, marginBottom: spacing.md, gap: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
