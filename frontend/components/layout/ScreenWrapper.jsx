import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';

/**
 * ScreenWrapper — wraps every screen with safe area, status bar,
 * and a consistent background. Use `edges` to control which safe
 * area edges to inset (default: all four).
 */
export default function ScreenWrapper({
  children,
  style,
  edges = ['top', 'bottom', 'left', 'right'],
  statusBarStyle = 'light-content',
  backgroundColor = COLORS.background,
}) {
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }, style]} edges={edges}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
      <View style={[styles.inner, { backgroundColor }]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
});
