import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Radius } from '../../constants/spacing';

export function Skeleton({ width = '100%', height = 16, borderRadius = Radius.sm, style }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: Colors.surfaceHigh, opacity }, style]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width='60%' height={14} />
          <Skeleton width='40%' height={11} />
        </View>
      </View>
      <Skeleton height={14} style={{ marginTop: 12 }} />
      <Skeleton height={14} width='80%' style={{ marginTop: 6 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, gap: 8, borderWidth: 1, borderColor: Colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
