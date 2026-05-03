import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

export default function Dashboard() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [recentContent, setRecentContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [contentRes] = await Promise.all([
        api.get('/api/business/auth/me', token),
      ]);
      const myContentRes = await api.get('/api/business/content/mine', token);
      const items = myContentRes.data?.items ?? myContentRes.data ?? [];
      const published = items.filter((i) => i.status === 'published').length;
      const pending = items.filter((i) => i.status === 'pending').length;
      setStats({ published, pending, total: items.length });
      setRecentContent(items.slice(0, 5));
    } catch (e) {
      setError(e.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const kpis = [
    { label: 'Total Posts', value: stats?.total ?? 0 },
    { label: 'Published', value: stats?.published ?? 0 },
    { label: 'Pending Review', value: stats?.pending ?? 0 },
  ];

  return (
    <View style={styles.page}>
      <Header title="Dashboard" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      >
        <Text style={styles.welcome}>Welcome back,{' '}
          <Text style={styles.accentText}>{user?.company_name}</Text>
        </Text>

        {error ? (
          <TouchableOpacity onPress={load}>
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.retryText}>Tap to retry</Text>
            </View>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.kpiRow}>
          {loading
            ? [0, 1, 2].map((i) => <Skeleton key={i} style={styles.kpiSkeleton} />)
            : kpis.map((k) => (
                <Card key={k.label} style={styles.kpi}>
                  <Text style={styles.kpiValue}>{k.value}</Text>
                  <Text style={styles.kpiLabel}>{k.label}</Text>
                </Card>
              ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Content</Text>
          <TouchableOpacity onPress={() => router.push('/(business)/my-content')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} style={styles.rowSkeleton} />)
        ) : recentContent.length === 0 ? (
          <EmptyState
            title="No content yet"
            message="Submit your first campaign to get started."
          />
        ) : (
          recentContent.map((item) => (
            <Card key={item.id} style={styles.row}>
              <View style={styles.rowInner}>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.rowMeta}>{item.target_sport || 'All sports'}</Text>
                </View>
                <Badge
                  label={item.status}
                  color={item.status === 'published' ? Colors.success : item.status === 'pending' ? Colors.warning : Colors.error}
                />
              </View>
            </Card>
          ))
        )}

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(business)/my-content')}>
            <Text style={styles.actionBtnText}>+ New Campaign</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => router.push('/(business)/search-creators')}>
            <Text style={styles.actionBtnTextSecondary}>Find Creators</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing[4], gap: Spacing[4], paddingBottom: 40 },
  welcome: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizes.xl, color: Colors.text },
  accentText: { color: Colors.accent },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: Typography.fontBodyBold, fontSize: Typography.sizes.base, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  seeAll: { fontFamily: Typography.fontBodyBold, fontSize: Typography.sizes.sm, color: Colors.accent },
  kpiRow: { flexDirection: 'row', gap: Spacing[3] },
  kpi: { flex: 1, alignItems: 'center', padding: Spacing[4] },
  kpiValue: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizes['2xl'], color: Colors.text },
  kpiLabel: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.xs, color: Colors.textMuted, textAlign: 'center' },
  kpiSkeleton: { flex: 1, height: 80, borderRadius: 10 },
  rowSkeleton: { height: 64, borderRadius: 10 },
  row: { padding: Spacing[4] },
  rowInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowText: { flex: 1, marginRight: Spacing[2] },
  rowTitle: { fontFamily: Typography.fontBodyMedium, fontSize: Typography.sizes.base, color: Colors.text },
  rowMeta: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: Colors.textMuted, marginTop: 2 },
  errorBox: { backgroundColor: Colors.surfaceHigh, borderWidth: 1, borderColor: Colors.error, borderRadius: 10, padding: Spacing[4] },
  errorText: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, color: Colors.error },
  retryText: { fontFamily: Typography.fontBodyBold, fontSize: Typography.sizes.sm, color: Colors.textMuted, marginTop: 4 },
  quickActions: { flexDirection: 'row', gap: Spacing[3] },
  actionBtn: { flex: 1, backgroundColor: Colors.accent, borderRadius: 10, paddingVertical: Spacing[4], alignItems: 'center' },
  actionBtnText: { fontFamily: Typography.fontBodyBold, fontSize: Typography.sizes.base, color: Colors.text },
  actionBtnSecondary: { backgroundColor: Colors.surfaceHigh, borderWidth: 1, borderColor: Colors.border },
  actionBtnTextSecondary: { fontFamily: Typography.fontBodyBold, fontSize: Typography.sizes.base, color: Colors.textMuted },
});
