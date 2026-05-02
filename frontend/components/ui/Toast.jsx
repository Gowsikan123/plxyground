import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors }      from '../../constants/colors';
import { fontSize }    from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

export function Toast({ message, type = 'info', visible, onHide, duration = 3000 }) {
  const insets = useSafeAreaInsets();
  const anim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start();
      const timer = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }).start(onHide);
      }, duration);
      return () => clearTimeout(timer);
    } else {
      anim.setValue(0);
    }
  }, [visible]);

  const bg = type === 'success' ? colors.success
           : type === 'error'   ? colors.error
           : '#333';

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        { bottom: insets.bottom + spacing[4], opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [20, 0] }) }] },
      ]}
    >
      <TouchableOpacity activeOpacity={0.85} onPress={onHide} style={[styles.pill, { backgroundColor: bg }]}>
        <Text style={styles.text}>{message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', left: spacing[4], right: spacing[4],
    alignItems: 'center', zIndex: 9999,
  },
  pill: {
    paddingHorizontal: spacing[5], paddingVertical: spacing[3],
    borderRadius: borderRadius.full, maxWidth: 320,
  },
  text: {
    color: colors.white, fontSize: fontSize.sm,
    fontFamily: 'DMSans_500Medium', textAlign: 'center',
  },
});
