import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CreatorLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0a0a0a', borderTopColor: '#1a1a1a' },
        tabBarActiveTintColor: '#7c3aed',
        tabBarInactiveTintColor: '#555',
        tabBarIcon: ({ color, size }) => {
          const icons = {
            feed: 'home-outline',
            create: 'add-circle-outline',
            opportunities: 'briefcase-outline',
            profile: 'person-outline',
            settings: 'settings-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="feed" options={{ title: 'Feed' }} />
      <Tabs.Screen name="create" options={{ title: 'Create' }} />
      <Tabs.Screen name="opportunities" options={{ title: 'Deals' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
