import { Tabs } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Text } from 'react-native';

function TabIcon({ label, focused }) {
  return <Text style={{ color: focused ? Colors.primary : Colors.textFaint, fontSize: 11, fontFamily: 'DMSans_500Medium', marginTop: 2 }}>{label}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 56,
          paddingBottom: 6,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textFaint,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="feed" options={{ tabBarIcon: ({ focused }) => <TabIcon label="Feed" focused={focused} /> }} />
      <Tabs.Screen name="discover" options={{ tabBarIcon: ({ focused }) => <TabIcon label="Discover" focused={focused} /> }} />
      <Tabs.Screen name="opportunities" options={{ tabBarIcon: ({ focused }) => <TabIcon label="Opps" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} /> }} />
    </Tabs>
  );
}
