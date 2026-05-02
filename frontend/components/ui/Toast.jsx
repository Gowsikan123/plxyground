import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { fontFamily, fontSize } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

export function Toast({ message, type = 'info', visible, onHide, duration = 3000 }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onHide?.());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const bgColor = {
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.surfaceElevated,
  }[type];

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + spacing[2], backgroundColor: bgColor, transform: [{ translateY }] },
      ]}
    >
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity onPress={onHide} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.close}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing[4],
    right: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: 10,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  message: {
    color: colors.textPrimary,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    flex: 1,
    marginRight: spacing[2],
  },
  close: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
});
