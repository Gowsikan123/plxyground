import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../components/layout/Header';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Spacing } from '../constants/spacing';

export default function Privacy() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <Header title="Privacy Policy" showBack />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing[8] }]}>
        <Text style={styles.heading}>Privacy Policy</Text>
        <Text style={styles.body}>Last updated: 2025{`\n\n`}PLXYGROUND collects email addresses, usernames, and content you voluntarily provide. We use this data solely to operate the platform. Auth tokens are stored securely on your device. We do not share your data with third parties except as required by law. You may delete your account at any time by contacting support@plxyground.com.{`\n\n`}For questions contact privacy@plxyground.com.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing[6] },
  heading: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizes['2xl'], color: Colors.text, marginBottom: Spacing[4] },
  body: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, color: Colors.textMuted, lineHeight: Typography.sizes.base * 1.7 },
});
