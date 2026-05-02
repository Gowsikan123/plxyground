import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { fontFamily, fontSize } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

const CREATOR_TABS = [
  { name: 'feed', label: 'Feed', icon: '🏠' },
  { name: 'create', label: 'Create', icon: '➕' },
  { name: 'opportunities', label: 'Opps', icon: '💼' },
  { name: 'profile', label: 'Profile', icon: '👤' },
];

const BUSINESS_TABS = [
  { name: 'dashboard', label: 'Home', icon: '📊' },
  { name: 'my-content', label: 'Content', icon: '📝' },
  { name: 'search-creators', label: 'Discover', icon: '🔍' },
  { name: 'opportunities', label: 'Opps', icon: '💼' },
  { name: 'profile', label: 'Profile', icon: '👤' },
];

export function TabBar({ state, descriptors, navigation, userType = 'creator' }) {
  const insets = useSafeAreaInsets();
  const tabs = userType === 'business' ? BUSINESS_TABS : CREATOR_TABS;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + spacing[2] }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const tab = tabs.find((t) => t.name === route.name) ?? tabs[index];

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tab}
            activeOpacity={0.7}
          >
            <Text style={[styles.icon, isFocused && styles.iconFocused]}>{tab?.icon}</Text>
            <Text style={[styles.label, isFocused && styles.labelFocused]}>
              {tab?.label}
            </Text>
            {isFocused && <View style={styles.indicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing[2],
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[1] + 2,
    position: 'relative',
  },
  icon: { fontSize: 20, marginBottom: spacing[1] },
  iconFocused: {},
  label: {
    color: colors.textMuted,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
  labelFocused: { color: colors.primary },
  indicator: {
    position: 'absolute',
    top: 0,
    left: '25%',
    right: '25%',
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
});
