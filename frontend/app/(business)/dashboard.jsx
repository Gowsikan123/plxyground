import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  return (
    <View style={styles.page}>
      <Header title="Dashboard" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.welcome}>Welcome back, {user?.company_name}!</Text>
        <View style={styles.grid}>
          <Card style={styles.kpi}><Text style={styles.kpiLabel}>Company</Text><Text style={styles.kpiValue}>{user?.company_name}</Text></Card>
          <Card style={styles.kpi}><Text style={styles.kpiLabel}>Industry</Text><Text style={styles.kpiValue}>{user?.industry || '—'}</Text></Card>
          <Card style={styles.kpi}><Text style={styles.kpiLabel}>Location</Text><Text style={styles.kpiValue}>{user?.location || '—'}</Text></Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing[5], gap: Spacing[4] },
  welcome: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizes.xl, color: Colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  kpi: { flex: 1, minWidth: '45%', gap: Spacing[1] },
  kpiLabel: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.xs, color: Colors.textMuted },
  kpiValue: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizes.lg, color: Colors.text },
});
