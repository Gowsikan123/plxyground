/**
 * WEB stub — expo-haptics is a native-only module and must never be
 * imported on the web target. Metro picks this file on web because it
 * has no platform extension, while haptics.native.js is picked on
 * iOS / Android.
 */

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

export function impactAsync()      { return Promise.resolve(); }
export function notificationAsync() { return Promise.resolve(); }
export function selectionAsync()   { return Promise.resolve(); }

export default {
  impactAsync,
  notificationAsync,
  selectionAsync,
  ImpactFeedbackStyle,
  NotificationFeedbackType,
};
