import { Tabs } from 'expo-router';
import { useAuth } from '@/auth/store';
import { useUnread } from '@/lib/useUnread';
import { colors } from '@/theme/tokens';

// Both roles share Feed, Opportunities and Profile. Creators also get
// Applications; brands get Listings. Detail and form screens are hidden tabs.
export default function AppLayout() {
  const role = useAuth((s) => s.session?.role);
  const isCreator = role === 'creator';
  const unread = useUnread();
  const unreadTotal = (unread.data?.notifications ?? 0) + (unread.data?.messages ?? 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarIconStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Feed' }} />
      <Tabs.Screen name="opportunities" options={{ title: 'Opportunities' }} />
      <Tabs.Screen name="applications" options={{ title: 'Applications', href: isCreator ? undefined : null }} />
      <Tabs.Screen name="listings" options={{ title: 'Listings', href: isCreator ? null : undefined }} />
      <Tabs.Screen
        name="inbox"
        options={{ title: 'Inbox', tabBarBadge: unreadTotal > 0 ? (unreadTotal > 99 ? '99+' : unreadTotal) : undefined }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="opportunity/[id]" options={{ href: null }} />
      <Tabs.Screen name="listing/new" options={{ href: null }} />
      <Tabs.Screen name="listing/[id]" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="chat/[threadId]" options={{ href: null }} />
      <Tabs.Screen name="post/new" options={{ href: null }} />
    </Tabs>
  );
}
