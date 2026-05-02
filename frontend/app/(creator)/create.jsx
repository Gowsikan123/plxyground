import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { createPost } from '../../services/contentService';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';

export default function Create() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = 'Title is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);
    const { error } = await createPost({ title: title.trim(), body: body.trim(), tags, media_type: 'none' });
    setLoading(false);
    if (error) {
      setToast({ visible: true, message: error, type: 'error' });
      return;
    }
    setTitle('');
    setBody('');
    setTagsRaw('');
    setErrors({});
    setToast({ visible: true, message: 'Post submitted for review!', type: 'success' });
  };

  return (
    <View style={styles.page}>
      <Header title="Create Post" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input label="Title *" value={title} onChangeText={setTitle} error={errors.title} />
        <Input label="Body" value={body} onChangeText={setBody} multiline numberOfLines={6} style={styles.textarea} />
        <Input label="Tags (comma separated)" value={tagsRaw} onChangeText={setTagsRaw} autoCapitalize="none" />
        <Text style={styles.hint}>Posts are reviewed before publishing.</Text>
        <Button title="Submit for Review" onPress={handleSubmit} loading={loading} style={styles.btn} />
      </ScrollView>
      <Toast message={toast.message} visible={toast.visible} type={toast.type} onHide={() => setToast({ visible: false, message: '', type: 'error' })} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing[5], gap: Spacing[4] },
  textarea: { minHeight: 120 },
  hint: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.xs, color: Colors.textFaint },
  btn: { marginTop: Spacing[2] },
});
