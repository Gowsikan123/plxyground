import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

export function Header({ title, showBack = false, right }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={[styles.header, { paddingTop: insets.top + Spacing[2] }]}>
      {showBack ? (
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      ) : <View style={styles.spacer} />}
      <Text style={styles.title}>{title}</Text>
      {right ? right : <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing[4], paddingBottom: Spacing[3], backgroundColor: Colors.bg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizes.lg, color: Colors.text },
  back: { minWidth: 60 },
  backText: { fontFamily: Typography.fontBodyMedium, fontSize: Typography.sizes.sm, color: Colors.accent },
  spacer: { minWidth: 60 },
});
