import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';

export default function SettingsScreen() {
  const { user, token } = useAuthStore();
  const [bio, setBio] = useState(user?.bio || '');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      await api.put('/auth/me', { bio }, token);
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Settings</Text>

      <Text style={styles.label}>Bio</Text>
      <TextInput style={[styles.input, styles.textarea]} value={bio} onChangeText={setBio}
        placeholder="Tell the world about you..." placeholderTextColor="#555" multiline numberOfLines={4} textAlignVertical="top" />

      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Changes</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 20, paddingTop: 24 },
  heading: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 24 },
  label: { color: '#aaa', fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#111', color: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderWidth: 1, borderColor: '#1e1e1e' },
  textarea: { minHeight: 100, paddingTop: 12 },
  btn: { backgroundColor: '#7c3aed', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
