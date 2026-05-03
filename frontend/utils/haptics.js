/**
 * Web-safe haptics shim.
 * On native (iOS/Android) delegates to the real expo-haptics module.
 * On web it is a no-op — Metro's static analyser is bypassed by building
 * the package name dynamically so it cannot resolve it at bundle time.
 */
import { Platform } from 'react-native';

let _Haptics = null;

if (Platform.OS !== 'web') {
  // Build the string at runtime so Metro's static resolver never sees it.
  // If it were a plain require('expo-haptics') literal, Metro would try to
  // bundle it even inside an if-block, causing a 500 on web when the
  // native module's platform-specific files don't resolve for the web target.
  try {
    const pkg = ['expo', 'haptics'].join('-');
    // eslint-disable-next-line import/no-dynamic-require
    _Haptics = require(pkg);
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
