import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';

export function Toast({ message, type = 'error', visible, onHide }) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }).start();
      const t = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }).start(onHide);
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [visible, anim, onHide]);

  if (!visible && !message) return null;

  const bg = type === 'error' ? Colors.error : type === 'success' ? Colors.success : Colors.warning;

  return (
    <Animated.View style={[
      styles.toast,
      { bottom: insets.bottom + Spacing[4], backgroundColor: bg, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] },
    ]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: { position: 'absolute', left: Spacing[4], right: Spacing[4], borderRadius: Radius.md, padding: Spacing[4], zIndex: 999 },
  text: { fontFamily: Typography.fontBodyMedium, fontSize: Typography.sizes.sm, color: Colors.text },
});
