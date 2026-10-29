import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { safety } from '@/api/endpoints';
import type { ReportReason, ReportTarget } from '@/api/types';
import { Body, Button, Screen, TextField, Title } from '@/components/ui';
import { colors, minTouchSize, radius, spacing, type } from '@/theme/tokens';

const REASONS: { value: ReportReason; label: string; hint: string }[] = [
  { value: 'spam', label: 'Spam', hint: 'Repeated, misleading or unwanted promotion' },
  { value: 'scam', label: 'Scam or fraud', hint: 'Asking for money up front, fake deals, phishing' },
  { value: 'harassment', label: 'Harassment or hate', hint: 'Bullying, threats or abuse' },
  { value: 'inappropriate', label: 'Inappropriate content', hint: 'Sexual, violent or graphic material' },
  { value: 'impersonation', label: 'Pretending to be someone', hint: 'A fake brand, athlete or person' },
  { value: 'other', label: 'Something else', hint: 'Tell us below' },
];

const NOUN: Record<ReportTarget, string> = {
  creator: 'account', business: 'account', content: 'post', opportunity: 'opportunity', message: 'message',
};

export default function Report() {
  const params = useLocalSearchParams<{ targetType: ReportTarget; targetId: string; name?: string }>();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | null>(null);
  const noun = NOUN[params.targetType] ?? 'item';

  const send = useMutation({
    mutationFn: () =>
      safety.report({
        target_type: params.targetType,
        target_id: Number(params.targetId),
        reason: reason!,
        details: details.trim() || undefined,
      }),
    onError: (err) => setError(err.message),
  });

  function submit() {
    if (!reason) return setError('Pick a reason.');
    if (reason === 'other' && !details.trim()) return setError('Tell us what is wrong.');
    setError(null);
    send.mutate();
  }

  if (send.isSuccess) {
    return (
      <Screen>
        <View style={styles.content}>
          <Title>Thanks for telling us</Title>
          <Body muted>A moderator will look at this {noun}. The person you reported won't know it was you.</Body>
          <View style={{ height: spacing.xl }} />
          <Button label="Done" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
          <Title>Report {noun}</Title>
          {params.name ? <Body muted>{params.name}</Body> : null}
          <View style={{ height: spacing.md }} />
          <View accessibilityRole="radiogroup" style={{ gap: spacing.sm }}>
            {REASONS.map((r) => {
              const selected = reason === r.value;
              return (
                <Pressable
                  key={r.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setReason(r.value)}
                  style={[styles.option, selected && styles.optionOn]}
                >
                  <Text style={styles.optionLabel}>{r.label}</Text>
                  <Text style={styles.optionHint}>{r.hint}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={{ height: spacing.md }} />
          <TextField
            label={reason === 'other' ? 'What is wrong?' : 'Anything else? (optional)'}
            value={details}
            onChangeText={setDetails}
            multiline
            maxLength={1000}
            style={{ minHeight: 96, textAlignVertical: 'top', paddingTop: spacing.sm }}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label="Send report" onPress={submit} loading={send.isPending} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.xs },
  option: {
    minHeight: minTouchSize, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, backgroundColor: colors.surface,
  },
  optionOn: { borderColor: colors.accent, backgroundColor: colors.surfaceRaised },
  optionLabel: { ...type.label, color: colors.text },
  optionHint: { ...type.caption, color: colors.textMuted, marginTop: 2 },
  error: { ...type.caption, color: colors.danger, marginBottom: spacing.sm },
});
