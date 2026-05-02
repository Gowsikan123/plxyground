import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';

const TAB_ICON = {
  dashboard: { focused: 'grid', unfocused: 'grid-outline' },
  discover: { focused: 'search', unfocused: 'search-outline' },
  opportunities: { focused: 'briefcase', unfocused: 'briefcase-outline' },
  account: { focused: 'business', unfocused: 'business-outline' },
};

export default function BusinessTabsLayout() {
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
        tabBarActiveTintColor: '#5ca85c',
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
