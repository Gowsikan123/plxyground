import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import Avatar from '../ui/Avatar';
import useAuthStore from '../../store/authStore';

export default function FeedHeader({ onSearchPress }) {
  const router = useRouter();
  const { user } = useAuthStore();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.logo}>PLXYGROUND</Text>
        <Text style={styles.subtitle}>Basketball Nxtion</Text>
      </View>
      <View style={styles.right}>
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={onSearchPress}
          accessibilityLabel="Search"
        >
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/profile')}
          accessibilityLabel="Your profile"
        >
          <Avatar
            uri={user?.avatar_url}
            name={user?.display_name || user?.username || 'U'}
            size={34}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  left: { flexDirection: 'column' },
  logo: {
    fontFamily: TYPOGRAPHY.fonts.display,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontFamily: TYPOGRAPHY.fonts.body,
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  searchBtn: { padding: SPACING.xs },
  searchIcon: { fontSize: 18 },
});
