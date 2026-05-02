import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors }  from '../../constants/colors';
import { fontSize } from '../../constants/typography';
import { spacing }  from '../../constants/spacing';

export function TabBar({ tabs, activeTab, onTabPress }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || spacing[2] }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.icon, isActive && styles.iconActive]}>
              {tab.icon}
            </Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:   'row',
    backgroundColor: colors.surface,
    borderTopWidth:  1,
    borderTopColor:  '#2A2A2A',
    paddingTop:      spacing[2],
  },
  tab:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  icon:       { fontSize: 22, opacity: 0.45 },
  iconActive: { opacity: 1 },
  label:      { color: colors.textMuted,   fontSize: fontSize.xs, fontFamily: 'DMSans_500Medium' },
  labelActive:{ color: colors.textPrimary, fontFamily: 'DMSans_600SemiBold' },
});
