import React from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

export default function BusinessLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: Colors.surface, borderTopColor: Colors.border, borderTopWidth: 1 },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontFamily: Typography.fontBodyMedium, fontSize: 11 },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <TabIcon label="📊" /> }} />
      <Tabs.Screen name="search-creators" options={{ title: 'Creators', tabBarIcon: ({ color }) => <TabIcon label="🔍" /> }} />
      <Tabs.Screen name="opportunities" options={{ title: 'Opps', tabBarIcon: ({ color }) => <TabIcon label="💼" /> }} />
      <Tabs.Screen name="my-content" options={{ title: 'Content', tabBarIcon: ({ color }) => <TabIcon label="📝" /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <TabIcon label="🏢" /> }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <TabIcon label="⚙️" /> }} />
    </Tabs>
  );
}

function TabIcon({ label }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 18 }}>{label}</Text>;
}
