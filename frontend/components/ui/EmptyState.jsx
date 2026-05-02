import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors }   from '../../constants/colors';
import { fontSize } from '../../constants/typography';
import { spacing }  from '../../constants/spacing';
import { Button }   from './Button';

export const EmptyState = React.memo(function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.desc}>{description}</Text>}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="secondary"
          style={styles.btn}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing[8], paddingVertical: spacing[12],
  },
  icon:  { marginBottom: spacing[5] },
  title: { color: colors.textPrimary, fontSize: fontSize.lg, fontFamily: 'Syne_700Bold', textAlign: 'center', marginBottom: spacing[2] },
  desc:  { color: colors.textSecondary, fontSize: fontSize.base, fontFamily: 'DMSans_400Regular', textAlign: 'center', lineHeight: 22, marginBottom: spacing[6] },
  btn:   { marginTop: spacing[2] },
});
