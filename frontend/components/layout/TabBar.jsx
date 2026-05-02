import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { fontFamilies, fontSizes } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

export default function TabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom + spacing.xs }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? options.title ?? route.name;
        const isFocused = state.index === index;
        const icon = options.tabBarIcon?.({ focused: isFocused, color: isFocused ? colors.primary : colors.textMuted, size: 22 });

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
          >
            {icon}
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    paddingTop: spacing.sm,
  },
  tab: { flex: 1, alignItems: 'center', gap: spacing.xs },
  tabLabel: { fontFamily: fontFamilies.body, fontSize: fontSizes.xs, color: colors.textMuted },
  tabLabelActive: { color: colors.primary, fontFamily: fontFamilies.bodyMedium },
});
