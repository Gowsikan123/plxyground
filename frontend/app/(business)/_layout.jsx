import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function BusinessLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0a0a0a', borderTopColor: '#1a1a1a' },
        tabBarActiveTintColor: '#7c3aed',
        tabBarInactiveTintColor: '#555',
        tabBarIcon: ({ color, size }) => {
          const icons = {
            dashboard: 'grid-outline',
            'my-content': 'document-text-outline',
            'search-creators': 'search-outline',
            'edit-profile': 'create-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="my-content" options={{ title: 'Content' }} />
      <Tabs.Screen name="search-creators" options={{ title: 'Creators' }} />
      <Tabs.Screen name="edit-profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
