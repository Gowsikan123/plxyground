import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';

export default function EditProfileScreen() {
  const { user, token, logout } = useAuthStore();
  const [bio, setBio] = useState(user?.bio || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      await api.put('/business/auth/me', { bio, website }, token);
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/business-login');
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Business Profile</Text>
      <Text style={styles.company}>{user?.company_name || 'Your Business'}</Text>

      <Text style={styles.label}>Bio</Text>
      <TextInput style={[styles.input, styles.textarea]} value={bio} onChangeText={setBio}
        placeholder="Describe your business..." placeholderTextColor="#555" multiline numberOfLines={4} textAlignVertical="top" />

      <Text style={styles.label}>Website</Text>
      <TextInput style={styles.input} value={website} onChangeText={setWebsite}
        placeholder="https://yourcompany.com" placeholderTextColor="#555" keyboardType="url" autoCapitalize="none" />

      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Changes</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
        <Text style={styles.btnLogoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 20, paddingTop: 32 },
  heading: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  company: { color: '#7c3aed', fontSize: 14, marginBottom: 24 },
  label: { color: '#aaa', fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#111', color: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderWidth: 1, borderColor: '#1e1e1e' },
  textarea: { minHeight: 100, paddingTop: 12 },
  btn: { backgroundColor: '#7c3aed', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnLogout: { marginTop: 16, paddingVertical: 14, alignItems: 'center' },
  btnLogoutText: { color: '#ef4444', fontSize: 15 },
});
