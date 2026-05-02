import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { fontFamilies, fontSizes } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import Button from './Button';

const EmptyState = React.memo(({ icon, title, subtitle, actionLabel, onAction }) => (
  <View style={styles.container}>
    {icon ? <Text style={styles.icon}>{icon}</Text> : null}
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    {actionLabel && onAction ? (
      <Button label={actionLabel} onPress={onAction} variant="primary" size="md" style={styles.action} />
    ) : null}
  </View>
));

EmptyState.displayName = 'EmptyState';
export default EmptyState;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl },
  icon: { fontSize: 48, marginBottom: spacing.lg },
  title: { fontFamily: fontFamilies.heading, fontSize: fontSizes.lg, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { fontFamily: fontFamilies.body, fontSize: fontSizes.md, color: colors.textSecondary, textAlign: 'center', lineHeight: fontSizes.md * 1.5 },
  action: { marginTop: spacing.xl },
});
