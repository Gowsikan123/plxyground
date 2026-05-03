import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { updateBusinessProfile } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

export default function EditProfile() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({ company_name: user?.company_name || '', bio: user?.bio || '', industry: user?.industry || '', website: user?.website || '', location: user?.location || '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setLoading(true);
    const { data, error } = await updateBusinessProfile(form);
    setLoading(false);
    if (error) { setToast({ visible: true, message: error, type: 'error' }); return; }
    updateUser(data);
    setToast({ visible: true, message: 'Profile updated.', type: 'success' });
    setTimeout(() => router.back(), 1200);
  };

  return (
    <View style={styles.page}>
      <Header title="Edit Profile" showBack />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input label="Company Name" value={form.company_name} onChangeText={set('company_name')} />
        <Input label="Bio" value={form.bio} onChangeText={set('bio')} multiline numberOfLines={4} />
        <Input label="Industry" value={form.industry} onChangeText={set('industry')} />
        <Input label="Website" value={form.website} onChangeText={set('website')} keyboardType="url" autoCapitalize="none" />
        <Input label="Location" value={form.location} onChangeText={set('location')} />
        <Button title="Save Changes" onPress={handleSave} loading={loading} style={styles.btn} />
      </ScrollView>
      <Toast message={toast.message} visible={toast.visible} type={toast.type} onHide={() => setToast({ visible: false, message: '', type: 'success' })} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing[5], gap: Spacing[4] },
  btn: { marginTop: Spacing[2] },
});
