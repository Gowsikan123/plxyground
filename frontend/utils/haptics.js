/**
 * Web-safe haptics shim.
 * On native (iOS/Android) delegates to the real expo-haptics module.
 * On web it's a no-op so Metro never tries to bundle a native-only package.
 */
import { Platform } from 'react-native';

let _Haptics = null;

if (Platform.OS !== 'web') {
  try {
    _Haptics = require('expo-haptics');
  } catch (_) {
    _Haptics = null;
  }
}

export const ImpactFeedbackStyle = {
  Light:  'Light',
  Medium: 'Medium',
  Heavy:  'Heavy',
};

export const NotificationFeedbackType = {
  Success: 'Success',
  Warning: 'Warning',
  Error:   'Error',
};

export function impactAsync(style) {
  return _Haptics?.impactAsync?.(style) ?? Promise.resolve();
}

export function notificationAsync(type) {
  return _Haptics?.notificationAsync?.(type) ?? Promise.resolve();
}

export function selectionAsync() {
  return _Haptics?.selectionAsync?.() ?? Promise.resolve();
}

export default {
  impactAsync,
  notificationAsync,
  selectionAsync,
  ImpactFeedbackStyle,
  NotificationFeedbackType,
};
