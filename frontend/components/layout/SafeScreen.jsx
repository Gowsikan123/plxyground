import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import { COLORS } from '../../constants/colors';

export default function SafeScreen({ children, style }) {
  return (
    <SafeAreaView style={[styles.safe, style]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.background}
      />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
