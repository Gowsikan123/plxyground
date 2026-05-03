import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { create } from 'zustand';
import { C, R } from '../theme';

export const useToastStore = create((set) => ({
  toasts: [],
  show: (message, type = 'info') => {
    const id = Date.now();
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 3200);
  },
  dismiss: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));

function ToastItem({ toast, onDismiss }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(opacity,    { toValue: 1, useNativeDriver: true, speed: 22 }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 220 }),
    ]).start();
  }, []);

  const bgColor     = toast.type === 'success' ? C.successDark  : toast.type === 'error' ? C.errorDark  : C.surface2;
  const borderColor = toast.type === 'success' ? 'rgba(34,197,94,0.3)' : toast.type === 'error' ? 'rgba(239,68,68,0.3)' : C.border;
  const textColor   = toast.type === 'success' ? C.success       : toast.type === 'error' ? C.error      : C.text;

  return (
    <Animated.View style={[s.toast, { backgroundColor: bgColor, borderColor, opacity, transform: [{ translateY }] }]}>
      <Text style={[s.toastText, { color: textColor }]} numberOfLines={2}>{toast.message}</Text>
      <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={{ color: textColor, fontSize: 16, fontWeight: '700', marginLeft: 8 }}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore();
  if (!toasts.length) return null;
  return (
    <View style={s.container} pointerEvents="box-none">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 64,
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
    pointerEvents: 'box-none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: R.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  toastText: { fontSize: 13, fontWeight: '600', flex: 1 },
});
