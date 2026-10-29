import { forwardRef, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, minTouchSize, radius, spacing, type } from '@/theme/tokens';

// ---- Screen -------------------------------------------------------------------

export function Screen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <SafeAreaView style={[styles.screen, style]} edges={['top', 'left', 'right']}>
      {children}
    </SafeAreaView>
  );
}

// ---- Text ----------------------------------------------------------------------

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title} accessibilityRole="header">{children}</Text>;
}

export function Body({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <Text style={[styles.body, muted && styles.muted]}>{children}</Text>;
}

// ---- Button --------------------------------------------------------------------

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', loading, disabled }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'ghost' && styles.buttonGhost,
        (pressed || isDisabled) && { opacity: 0.6 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.accentText : colors.text} />
      ) : (
        <Text style={[styles.buttonLabel, variant === 'primary' && { color: colors.accentText }]}>{label}</Text>
      )}
    </Pressable>
  );
}

// ---- Text field ------------------------------------------------------------------

interface FieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export const TextField = forwardRef<TextInput, FieldProps>(function TextField({ label, error, ...input }, ref) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error ? styles.inputError : null]}
        {...input}
      />
      {error ? <Text style={styles.errorText} accessibilityLiveRegion="polite">{error}</Text> : null}
    </View>
  );
});

// ---- Card -----------------------------------------------------------------------

export function Card({ children, onPress, accessibilityLabel }: {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  if (!onPress) return <View style={styles.card}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
    >
      {children}
    </Pressable>
  );
}

export function Tag({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'good' | 'warning' | 'bad' }) {
  const color = { neutral: colors.textMuted, good: colors.success, warning: colors.warning, bad: colors.danger }[tone];
  return (
    <View style={[styles.tag, tone !== 'neutral' && { borderWidth: 1, borderColor: color }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

const STATUS_TONE = { pending: 'warning', accepted: 'good', rejected: 'bad' } as const;
const STATUS_LABEL = { pending: 'Pending', accepted: 'Accepted', rejected: 'Not selected' } as const;

/** Application status as a coloured tag. */
export function StatusTag({ status }: { status: keyof typeof STATUS_TONE }) {
  return <Tag label={STATUS_LABEL[status]} tone={STATUS_TONE[status]} />;
}

// ---- States ---------------------------------------------------------------------

export function CenteredState({ title, message, action }: {
  title: string;
  message?: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.centered}>
      <Text style={styles.heading}>{title}</Text>
      {message ? <Body muted>{message}</Body> : null}
      {action ? <View style={{ marginTop: spacing.lg }}><Button label={action.label} onPress={action.onPress} variant="secondary" /></View> : null}
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.centered} accessibilityLabel="Loading">
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  title: { ...type.title, color: colors.text },
  heading: { ...type.heading, color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  body: { ...type.body, color: colors.text },
  muted: { color: colors.textMuted },
  button: {
    minHeight: minTouchSize,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: { backgroundColor: colors.accent },
  buttonSecondary: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  buttonGhost: { backgroundColor: 'transparent' },
  buttonLabel: { ...type.label, color: colors.text },
  field: { marginBottom: spacing.lg },
  fieldLabel: { ...type.label, color: colors.textMuted, marginBottom: spacing.xs },
  input: {
    minHeight: minTouchSize,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: spacing.md,
    ...type.body,
  },
  inputError: { borderColor: colors.danger },
  errorText: { ...type.caption, color: colors.danger, marginTop: spacing.xs },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginRight: spacing.xs,
  },
  tagText: { ...type.caption, color: colors.textMuted },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
});
