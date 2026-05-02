import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { useFeedStore } from '../../store/feedStore';

const CATEGORIES = ['Lifestyle', 'Tech', 'Fashion', 'Food', 'Travel', 'Sports', 'Music', 'Art', 'Gaming', 'Other'];

export default function CreateScreen() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('Other');
  const [loading, setLoading] = useState(false);
  const token = useAuthStore((s) => s.token);
  const refreshFeed = useFeedStore((s) => s.refreshFeed);

  async function handleSubmit() {
    if (!title.trim() || !body.trim()) return Alert.alert('Error', 'Title and body are required');
    setLoading(true);
    try {
      await api.post('/content', { title: title.trim(), body: body.trim(), category }, token);
      Alert.alert('Posted!', 'Your post has been submitted for review.');
      setTitle('');
      setBody('');
      setCategory('Other');
      await refreshFeed();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to post');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>New Post</Text>

        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="What’s this about?" placeholderTextColor="#555" />

        <Text style={styles.label}>Body</Text>
        <TextInput style={[styles.input, styles.textarea]} value={body} onChangeText={setBody}
          placeholder="Write your content here..." placeholderTextColor="#555" multiline numberOfLines={8} textAlignVertical="top" />

        <Text style={styles.label}>Category</Text>
        <View style={styles.categories}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat} style={[styles.catBtn, category === cat && styles.catBtnActive]}
              onPress={() => setCategory(cat)}>
              <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Post</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 20, paddingTop: 24 },
  heading: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 24 },
  label: { color: '#aaa', fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#111', color: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderWidth: 1, borderColor: '#1e1e1e' },
  textarea: { minHeight: 140, paddingTop: 12 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#2a2a2a', backgroundColor: '#111' },
  catBtnActive: { borderColor: '#7c3aed', backgroundColor: '#2d1b6b' },
  catText: { color: '#888', fontSize: 13 },
  catTextActive: { color: '#c4b5fd' },
  btn: { backgroundColor: '#7c3aed', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
