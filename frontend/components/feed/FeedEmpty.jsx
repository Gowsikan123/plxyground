import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import Button from '../ui/Button';

export default function FeedEmpty({ onRefresh }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🏀</Text>
      <Text style={styles.title}>No posts yet</Text>
      <Text style={styles.body}>
        When creators you follow post content, it'll show up here.
      </Text>
      <Button label="Refresh" onPress={onRefresh} variant="outline" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  icon: { fontSize: 48, marginBottom: SPACING.sm },
  title: {
    fontFamily: TYPOGRAPHY.fonts.display,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  body: {
    fontFamily: TYPOGRAPHY.fonts.body,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
});
