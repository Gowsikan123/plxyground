import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { C, R } from './theme';

export default function Toast({ message, type = 'success', visible, onHide }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: true }),
      ]).start(() => { translateY.setValue(-20); onHide && onHide(); });
    }, 2800);
    return () => clearTimeout(t);
  }, [visible, message]);

  if (!visible) return null;

  const bg = type === 'error' ? C.error : type === 'warning' ? '#c47a00' : C.success;

  return (
    <Animated.View style={[s.wrap, { opacity, transform: [{ translateY }], backgroundColor: bg }]}>
      <Text style={s.text}>{message}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', top: 56, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: R.full, zIndex: 999, maxWidth: '88%' },
  text: { color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'center' },
});
