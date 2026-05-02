import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { fontSize, fontFamily } from '../../constants/typography';

const TYPE_COLORS = {
  success: colors.success,
  error:   colors.error,
  info:    colors.textSecondary,
  warning: colors.warning,
};

export function Toast({ message, type = 'info', onDismiss }) {
  const insets   = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(100)).current;
  const opacAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(opacAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 100, duration: 250, useNativeDriver: true }),
        Animated.timing(opacAnim,  { toValue: 0,   duration: 250, useNativeDriver: true }),
      ]).start(() => onDismiss?.());
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: insets.bottom + spacing[4], transform: [{ translateY: slideAnim }], opacity: opacAnim },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: TYPE_COLORS[type] }]} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position:        'absolute',
    left:            spacing[4],
    right:           spacing[4],
    backgroundColor: colors.surfaceElevated,
    borderRadius:    radius.md,
    paddingVertical:   spacing[3],
    paddingHorizontal: spacing[4],
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing[2],
    zIndex:          9999,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.4,
    shadowRadius:    8,
    elevation:       8,
  },
  dot: {
    width: 8, height: 8, borderRadius: radius.full,
  },
  text: {
    flex:       1,
    color:      colors.textPrimary,
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.dmSans.regular,
  },
});
