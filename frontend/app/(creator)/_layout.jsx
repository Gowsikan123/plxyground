import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';

const TAB_ICON = {
  feed: { focused: 'home', unfocused: 'home-outline' },
  create: { focused: 'add-circle', unfocused: 'add-circle-outline' },
  opportunities: { focused: 'briefcase', unfocused: 'briefcase-outline' },
  profile: { focused: 'person', unfocused: 'person-outline' },
  settings: { focused: 'settings', unfocused: 'settings-outline' },
};

export default function CreatorTabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 6,
          height: 62,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { ...TYPOGRAPHY.labelSm, marginTop: 2 },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICON[route.name] || { focused: 'ellipse', unfocused: 'ellipse-outline' };
          return <Ionicons name={focused ? icons.focused : icons.unfocused} size={size} color={color} />;
        },
      })}
    />
  );
}
