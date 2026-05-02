import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../components/layout/Header';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';

export default function BusinessSettings() {
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <View style={styles.page}>
      <Header title="Settings" />
      <View style={styles.content}>
        <TouchableOpacity style={styles.item} onPress={() => router.push('/terms')}>
          <Text style={styles.itemText}>Terms of Service</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => router.push('/privacy')}>
          <Text style={styles.itemText}>Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.item, styles.danger]} onPress={handleSignOut}>
          <Text style={[styles.itemText, { color: Colors.error }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing[4], gap: Spacing[2] },
  item: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing[4], borderWidth: 1, borderColor: Colors.border },
  danger: { borderColor: Colors.error + '44' },
  itemText: { fontFamily: Typography.fontBodyMedium, fontSize: Typography.sizes.base, color: Colors.text },
});
