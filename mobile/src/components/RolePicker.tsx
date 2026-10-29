import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Role } from '@/api/types';
import { colors, minTouchSize, radius, spacing, type } from '@/theme/tokens';

const OPTIONS: { value: Role; label: string }[] = [
  { value: 'creator', label: 'Creator' },
  { value: 'business', label: 'Brand' },
];

/** Segmented control for choosing creator or brand. */
export function RolePicker({ value, onChange }: { value: Role; onChange: (role: Role) => void }) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.option, selected && styles.selected]}
          >
            <Text style={[styles.label, selected && styles.selectedLabel]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xs,
    marginBottom: spacing.xl,
  },
  option: {
    flex: 1,
    minHeight: minTouchSize - 8,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.surfaceRaised },
  label: { ...type.label, color: colors.textMuted },
  selectedLabel: { color: colors.text },
});
