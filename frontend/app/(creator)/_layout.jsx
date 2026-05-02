import React from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

export default function CreatorLayout() {
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
      <Tabs.Screen name="feed" options={{ title: 'Feed', tabBarIcon: ({ color }) => <TabIcon label="🎮" color={color} /> }} />
      <Tabs.Screen name="opportunities" options={{ title: 'Opps', tabBarIcon: ({ color }) => <TabIcon label="💼" color={color} /> }} />
      <Tabs.Screen name="create" options={{ title: 'Create', tabBarIcon: ({ color }) => <TabIcon label="➕" color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <TabIcon label="👤" color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <TabIcon label="⚙️" color={color} /> }} />
    </Tabs>
  );
}

function TabIcon({ label }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 18 }}>{label}</Text>;
}
