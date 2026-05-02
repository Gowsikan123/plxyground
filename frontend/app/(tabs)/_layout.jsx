import { Tabs } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';

function TabIcon({ label, focused }) {
  const icons = {
    Feed: focused ? '🏀' : '🏀',
    Opportunities: focused ? '🎯' : '🎯',
    Create: focused ? '➕' : '➕',
    Profile: focused ? '👤' : '👤',
  };
  return null; // icon rendered via tabBarIcon emoji approach below
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontFamily: TYPOGRAPHY.fonts.body,
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{ title: 'Feed', tabBarIcon: ({ focused }) => null }}
      />
      <Tabs.Screen
        name="opportunities"
        options={{ title: 'Deals', tabBarIcon: ({ focused }) => null }}
      />
      <Tabs.Screen
        name="create"
        options={{ title: 'Post', tabBarIcon: ({ focused }) => null }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ focused }) => null }}
      />
    </Tabs>
  );
}
