import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ApiError } from '@/api/client';
import { opportunities } from '@/api/endpoints';
import { Body, Button, Screen, TextField, Title } from '@/components/ui';
import { fieldErrors, opportunitySchema } from '@/lib/validation';
import { spacing } from '@/theme/tokens';

export default function NewListing() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: '', description: '', sport: '', location: '', budget: '', deadline: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const create = useMutation({
    mutationFn: opportunities.create,
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      router.replace({ pathname: '/listing/[id]', params: { id: String(created.id) } });
    },
    onError: (err) => setErrors({ form: err instanceof ApiError ? err.message : 'Could not post. Try again.' }),
  });

  function submit() {
    const parsed = opportunitySchema.safeParse(form);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    create.mutate(parsed.data);
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
          <Title>Post an opportunity</Title>
          <View style={{ height: spacing.lg }} />
          <TextField label="Title" value={form.title} onChangeText={set('title')} placeholder="e.g. Summer ambassador" error={errors.title} />
          <TextField
            label="What you're offering and looking for"
            value={form.description}
            onChangeText={set('description')}
            multiline
            style={{ minHeight: 120, textAlignVertical: 'top', paddingTop: spacing.sm }}
            error={errors.description}
          />
          <TextField label="Sport (optional)" value={form.sport} onChangeText={set('sport')} error={errors.sport} />
          <TextField label="Location (optional)" value={form.location} onChangeText={set('location')} error={errors.location} />
          <TextField label="Budget (optional)" value={form.budget} onChangeText={set('budget')} placeholder="e.g. £500 + kit" error={errors.budget} />
          <TextField
            label="Apply by (optional, YYYY-MM-DD)"
            value={form.deadline}
            onChangeText={set('deadline')}
            placeholder="2026-12-31"
            autoCapitalize="none"
            error={errors.deadline}
          />
          {errors.form ? <Body>{errors.form}</Body> : null}
          <View style={{ height: spacing.md }} />
          <Button label="Post" onPress={submit} loading={create.isPending} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg },
});
