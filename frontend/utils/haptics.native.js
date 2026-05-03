/**
 * NATIVE (iOS / Android) — delegates directly to expo-haptics.
 * Metro picks this file on native targets and ignores haptics.js.
 */
import * as ExpoHaptics from 'expo-haptics';

export const ImpactFeedbackStyle      = ExpoHaptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = ExpoHaptics.NotificationFeedbackType;

export function impactAsync(style) {
  return ExpoHaptics.impactAsync(style);
}

export function notificationAsync(type) {
  return ExpoHaptics.notificationAsync(type);
}

export function selectionAsync() {
  return ExpoHaptics.selectionAsync();
}

export default {
  impactAsync,
  notificationAsync,
  selectionAsync,
  ImpactFeedbackStyle,
  NotificationFeedbackType,
};
