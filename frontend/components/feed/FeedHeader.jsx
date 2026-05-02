import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import Avatar from '../ui/Avatar';

export default function FeedHeader({ user, onNotificationsPress }) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <TouchableOpacity onPress={() => router.push('/profile')} activeOpacity={0.8}>
          <Avatar
            uri={user?.avatar_url}
            initials={user?.username?.[0]?.toUpperCase() ?? 'P'}
            size={36}
          />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.appName}>PLXYGROUND</Text>
          <Text style={styles.greeting}>Hey {user?.username ?? 'Creator'} 👋</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={onNotificationsPress}
        accessibilityLabel="Notifications"
        activeOpacity={0.7}
      >
        <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
      </TouchableOpacity>
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
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  titleBlock: {
    justifyContent: 'center',
  },
  appName: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.primary,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  greeting: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.textMuted,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
});
