import React, { useEffect, useRef, useCallback } from 'react';
import { Animated, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

export const Toast = React.memo(({ message, type = 'info', onDismiss, duration = 3000 }) => {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const insets     = useSafeAreaInsets();

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 100, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity,    { toValue: 0,   duration: 250, useNativeDriver: true }),
    ]).start(() => onDismiss?.());
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      Animated.timing(opacity,    { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, []);

  const borderColor = type === 'success' ? colors.success : type === 'error' ? colors.error : colors.border;

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: insets.bottom + spacing.base, borderColor, transform: [{ translateY }], opacity },
      ]}
    >
      <Text style={styles.msg} numberOfLines={3}>{message}</Text>
      <TouchableOpacity onPress={dismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.close}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

export function useToast() {
  const [toasts, setToasts] = React.useState([]);
  const show = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);
  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  const ToastContainer = useCallback(() => (
    <>
      {toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type} onDismiss={() => dismiss(t.id)} />
      ))}
    </>
  ), [toasts]);
  return { show, ToastContainer };
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.base, right: spacing.base,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  msg:   { ...typography.body, flex: 1, color: colors.textPrimary },
  close: { ...typography.caption, color: colors.textSecondary, fontSize: 16 },
});
