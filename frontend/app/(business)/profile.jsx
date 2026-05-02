import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../components/layout/Header';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';

export default function BusinessProfile() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  return (
    <View style={styles.page}>
      <Header title="Company Profile" right={
        <TouchableOpacity onPress={() => router.push('/(business)/edit-profile')}>
          <Text style={styles.editBtn}>Edit</Text>
        </TouchableOpacity>
      } />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Avatar uri={user.logo_url} name={user.company_name} size={72} />
          <View style={styles.info}>
            <Text style={styles.name}>{user.company_name}</Text>
            {user.industry ? <Text style={styles.sub}>{user.industry}</Text> : null}
          </View>
        </View>
        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
        <View style={styles.stats}>
          {user.website ? <Text style={styles.stat}>🌐 {user.website}</Text> : null}
          {user.location ? <Text style={styles.stat}>📍 {user.location}</Text> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing[5], gap: Spacing[4] },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing[4] },
  info: { flex: 1, gap: Spacing[1] },
  name: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizes.xl, color: Colors.text },
  sub: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: Colors.textMuted },
  bio: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, color: Colors.textMuted },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  stat: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: Colors.textMuted },
  editBtn: { fontFamily: Typography.fontBodyMedium, fontSize: Typography.sizes.sm, color: Colors.accent },
});
