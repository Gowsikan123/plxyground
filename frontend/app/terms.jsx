import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../components/layout/Header';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Spacing } from '../constants/spacing';

export default function Terms() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <Header title="Terms of Service" showBack />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing[8] }]}>
        <Text style={styles.heading}>Terms of Service</Text>
        <Text style={styles.body}>Last updated: 2025{`\n\n`}By using PLXYGROUND you agree to these terms. You are responsible for the content you post. PLXYGROUND reserves the right to suspend accounts that violate community guidelines. Content submitted for publication is reviewed by moderators. We do not sell your personal data. Use of the platform for spam, illegal activity, or harassment will result in immediate suspension.{`\n\n`}For questions contact legal@plxyground.com.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing[6] },
  heading: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizes['2xl'], color: Colors.text, marginBottom: Spacing[4] },
  body: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, color: Colors.textMuted, lineHeight: Typography.sizes.base * 1.7 },
});
