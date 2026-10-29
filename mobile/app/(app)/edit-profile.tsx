import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ApiError } from '@/api/client';
import { auth, creators } from '@/api/endpoints';
import { useAuth } from '@/auth/store';
import { Body, Button, Screen, TextField, Title } from '@/components/ui';
import { businessProfileSchema, creatorProfileSchema, fieldErrors } from '@/lib/validation';
import { spacing } from '@/theme/tokens';

export default function EditProfile() {
  const session = useAuth((s) => s.session);
  const refreshProfile = useAuth((s) => s.refreshProfile);
  const isCreator = session?.role === 'creator';

  const [form, setForm] = useState(() =>
    session?.role === 'creator'
      ? { name: session.user.display_name, bio: session.user.bio ?? '', sport: session.user.sport ?? '', location: session.user.location ?? '', industry: '', website: '' }
      : { name: session?.user.company_name ?? '', bio: session?.user.bio ?? '', sport: '', location: session?.user.location ?? '', industry: session?.user.industry ?? '', website: session?.user.website ?? '' },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: async () => {
      if (!session) return;
      if (session.role === 'creator') {
        const parsed = creatorProfileSchema.parse(form);
        await creators.update(session.user.creator_id, {
          display_name: parsed.name, bio: parsed.bio, sport: parsed.sport, location: parsed.location,
        });
      } else {
        const parsed = businessProfileSchema.parse(form);
        await auth.updateBusiness({
          company_name: parsed.name, bio: parsed.bio, industry: parsed.industry, location: parsed.location,
          website: parsed.website || null,
        });
      }
      await refreshProfile();
    },
    onSuccess: () => router.back(),
    onError: (err) => setErrors({ form: err instanceof ApiError ? err.message : 'Could not save. Try again.' }),
  });

  function submit() {
    const parsed = (isCreator ? creatorProfileSchema : businessProfileSchema).safeParse(form);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    save.mutate();
  }

  if (!session) return null;

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
          <Title>Edit profile</Title>
          <View style={{ height: spacing.lg }} />
          <TextField label={isCreator ? 'Name' : 'Company name'} value={form.name} onChangeText={set('name')} error={errors.name} />
          <TextField
            label="Bio"
            value={form.bio}
            onChangeText={set('bio')}
            multiline
            maxLength={500}
            style={{ minHeight: 100, textAlignVertical: 'top', paddingTop: spacing.sm }}
            error={errors.bio}
          />
          {isCreator ? (
            <TextField label="Sport" value={form.sport} onChangeText={set('sport')} error={errors.sport} />
          ) : (
            <>
              <TextField label="Industry" value={form.industry} onChangeText={set('industry')} error={errors.industry} />
              <TextField
                label="Website"
                value={form.website}
                onChangeText={set('website')}
                autoCapitalize="none"
                keyboardType="url"
                placeholder="https://"
                error={errors.website}
              />
            </>
          )}
          <TextField label="Location" value={form.location} onChangeText={set('location')} error={errors.location} />
          {errors.form ? <Body>{errors.form}</Body> : null}
          <View style={{ height: spacing.md }} />
          <Button label="Save" onPress={submit} loading={save.isPending} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg },
});
