import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ApiError } from '@/api/client';
import { content } from '@/api/endpoints';
import { Body, Button, Screen, TextField, Title } from '@/components/ui';
import { pickAndUploadPhoto } from '@/lib/media';
import { fieldErrors, postSchema } from '@/lib/validation';
import { radius, spacing } from '@/theme/tokens';

export default function NewPost() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  async function addPhoto() {
    setUploading(true);
    setErrors({});
    try {
      const url = await pickAndUploadPhoto();
      if (url) setPhotoUrl(url);
    } catch (err) {
      setErrors({ photo: err instanceof Error ? err.message : 'Could not add that photo.' });
    } finally {
      setUploading(false);
    }
  }

  const create = useMutation({
    mutationFn: content.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['feed'] });
      setSubmitted(true);
    },
    onError: (err) => setErrors({ form: err instanceof ApiError ? err.message : 'Could not post. Try again.' }),
  });

  function submit() {
    const parsed = postSchema.safeParse({ title, body });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    create.mutate({
      title: parsed.data.title,
      body: parsed.data.body,
      media_url: photoUrl ?? undefined,
      media_type: photoUrl ? 'image' : 'none',
    });
  }

  if (submitted) {
    return (
      <Screen>
        <View style={styles.content}>
          <Title>Sent for review</Title>
          <Body muted>Every post is checked before it goes live. You'll get a notification when it's approved.</Body>
          <View style={{ height: spacing.xl }} />
          <Button label="Back to the feed" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
          <Title>New post</Title>
          <View style={{ height: spacing.lg }} />
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.photo} contentFit="cover" accessibilityLabel="Selected photo" />
          ) : null}
          <Button
            label={photoUrl ? 'Change photo' : 'Add a photo'}
            variant="secondary"
            onPress={() => void addPhoto()}
            loading={uploading}
          />
          {errors.photo ? <Body>{errors.photo}</Body> : null}
          <View style={{ height: spacing.lg }} />
          <TextField label="Title" value={title} onChangeText={setTitle} error={errors.title} />
          <TextField
            label="Caption (optional)"
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={2000}
            style={{ minHeight: 100, textAlignVertical: 'top', paddingTop: spacing.sm }}
            error={errors.body}
          />
          {errors.form ? <Body>{errors.form}</Body> : null}
          <View style={{ height: spacing.md }} />
          <Button label="Post" onPress={submit} loading={create.isPending} disabled={uploading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg, marginBottom: spacing.sm },
});
