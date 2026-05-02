import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

const CREATOR_TABS = [
  { key: 'feed',          label: 'Feed',     icon: '⚡' },
  { key: 'create',        label: 'Create',   icon: '＋' },
  { key: 'opportunities', label: 'Collab',   icon: '🤝' },
  { key: 'profile',       label: 'Profile',  icon: '👤' },
];

const BUSINESS_TABS = [
  { key: 'dashboard',        label: 'Home',     icon: '📊' },
  { key: 'my-content',       label: 'Content',  icon: '📄' },
  { key: 'search-creators',  label: 'Discover', icon: '🔍' },
  { key: 'opportunities',    label: 'Collab',   icon: '🤝' },
  { key: 'profile',          label: 'Profile',  icon: '🏢' },
];

export const TabBar = React.memo(({ state, descriptors, navigation, userType }) => {
  const insets = useSafeAreaInsets();
  const tabs   = userType === 'business' ? BUSINESS_TABS : CREATOR_TABS;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || spacing.sm }]}>
      {tabs.map((tab) => {
        const route   = state.routes.find(r => r.name === tab.key) || state.routes[0];
        const focused = state.routes[state.index]?.name === tab.key;

        const onPress = useCallback(() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(tab.key);
        }, [focused, route.key]);

        return (
          <TouchableOpacity
            key={tab.key}
            onPress={onPress}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: focused }}
          >
            <Text style={[styles.icon, focused && styles.iconActive]}>{tab.icon}</Text>
            <Text style={[styles.label, focused && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  tab:          { flex: 1, alignItems: 'center', gap: 3 },
  icon:         { fontSize: 20 },
  iconActive:   { },
  label:        { ...typography.label, fontSize: 10, color: colors.textMuted },
  labelActive:  { color: colors.primary },
});
