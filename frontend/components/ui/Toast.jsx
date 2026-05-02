import React, { createContext, useContext, useCallback, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { fontFamilies, fontSizes } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const showToast = useCallback((message, type = 'info') => {
    const id = ++idRef.current;
    const anim = new Animated.Value(0);
    setToasts((prev) => [...prev, { id, message, type, anim }]);

    Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: true }).start();

    setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      });
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <View style={styles.container} pointerEvents="none">
        {toasts.map((t) => (
          <Animated.View
            key={t.id}
            style={[
              styles.toast,
              t.type === 'success' && styles.success,
              t.type === 'error' && styles.error,
              t.type === 'info' && styles.info,
              { opacity: t.anim, transform: [{ translateY: t.anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] },
            ]}
          >
            <Text style={styles.text}>{t.message}</Text>
          </Animated.View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    alignItems: 'center',
    gap: spacing.sm,
  },
  toast: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    maxWidth: 340,
    alignSelf: 'center',
  },
  text: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.white,
    textAlign: 'center',
  },
  success: { backgroundColor: '#0e4d25' },
  error: { backgroundColor: '#5a0d0d' },
  info: { backgroundColor: '#1a1a2e' },
});
