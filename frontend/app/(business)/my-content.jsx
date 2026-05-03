import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Alert, RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Toast } from '../../components/ui/Toast';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

export default function MyContent() {
  const { token } = useAuthStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ title: '', body: '', budget_range: '', target_sport: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/api/business/content/mine', token);
      setItems(res.data?.items ?? res.data ?? []);
    } catch (e) {
      setError(e.message || 'Failed to load content');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const openCreate = () => {
    setEditTarget(null);
    setForm({ title: '', body: '', budget_range: '', target_sport: '' });
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setEditTarget(item);
    setForm({ title: item.title, body: item.body || '', budget_range: item.budget_range || '', target_sport: item.target_sport || '' });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { showToast('Title is required', 'error'); return; }
    setSubmitting(true);
    try {
      if (editTarget) {
        await api.put(`/api/business/content/${editTarget.id}`, form, token);
        showToast('Content updated', 'success');
      } else {
        await api.post('/api/business/content', form, token);
        showToast('Submitted for review', 'success');
      }
      setModalVisible(false);
      load();
    } catch (e) {
      showToast(e.message || 'Failed to save', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (item) => {
    Alert.alert('Delete Content', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.put(`/api/business/content/${item.id}`, { status: 'deleted' }, token);
            showToast('Deleted', 'info');
            load();
          } catch (e) {
            showToast(e.message || 'Delete failed', 'error');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Badge
          label={item.status}
          color={item.status === 'published' ? Colors.success : item.status === 'pending' ? Colors.warning : Colors.error}
        />
      </View>
      {item.body ? <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text> : null}
      <View style={styles.cardMeta}>
        {item.target_sport ? <Text style={styles.metaText}>🏅 {item.target_sport}</Text> : null}
        {item.budget_range ? <Text style={styles.metaText}>💰 {item.budget_range}</Text> : null}
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={styles.page}>
      <Header title="My Content" />

      {loading ? (
        <View style={styles.list}>
          {[0, 1, 2].map((i) => <Skeleton key={i} style={styles.skeleton} />)}
        </View>
      ) : error ? (
        <TouchableOpacity onPress={load} style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText}>Tap to retry</Text>
        </TouchableOpacity>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          estimatedItemSize={140}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState title="No content yet" message="Tap + to submit your first campaign for review." />
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openCreate} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Submit / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{editTarget ? 'Edit Campaign' : 'New Campaign'}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.input}
                placeholder="Campaign title *"
                placeholderTextColor={Colors.textFaint}
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
              />
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Description"
                placeholderTextColor={Colors.textFaint}
                value={form.body}
                onChangeText={(v) => setForm((f) => ({ ...f, body: v }))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <TextInput
                style={styles.input}
                placeholder="Budget range (e.g. £500–£1000)"
                placeholderTextColor={Colors.textFaint}
                value={form.budget_range}
                onChangeText={(v) => setForm((f) => ({ ...f, budget_range: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Target sport (e.g. Football)"
                placeholderTextColor={Colors.textFaint}
                value={form.target_sport}
                onChangeText={(v) => setForm((f) => ({ ...f, target_sport: v }))}
              />
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                <Text style={styles.submitBtnText}>{submitting ? 'Saving…' : editTarget ? 'Save Changes' : 'Submit'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {toast ? <Toast message={toast.message} type={toast.type} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.bg },
  list: { padding: Spacing[4], gap: Spacing[3], paddingBottom: 100 },
  skeleton: { height: 130, borderRadius: 10, marginBottom: Spacing[3] },
  card: { padding: Spacing[4], gap: Spacing[2] },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { flex: 1, fontFamily: Typography.fontBodyMedium, fontSize: Typography.sizes.base, color: Colors.text, marginRight: Spacing[2] },
  cardBody: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: Colors.textMuted },
  cardMeta: { flexDirection: 'row', gap: Spacing[3] },
  metaText: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.xs, color: Colors.textFaint },
  cardActions: { flexDirection: 'row', gap: Spacing[2], marginTop: Spacing[2] },
  editBtn: { flex: 1, backgroundColor: Colors.surfaceHigh, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  editBtnText: { fontFamily: Typography.fontBodyBold, fontSize: Typography.sizes.sm, color: Colors.text },
  deleteBtn: { flex: 1, backgroundColor: 'rgba(255,68,68,0.1)', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  deleteBtnText: { fontFamily: Typography.fontBodyBold, fontSize: Typography.sizes.sm, color: Colors.error },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[6] },
  errorText: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, color: Colors.error, textAlign: 'center' },
  retryText: { fontFamily: Typography.fontBodyBold, fontSize: Typography.sizes.sm, color: Colors.textMuted, marginTop: 8 },
  fab: { position: 'absolute', bottom: 32, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: Colors.accent, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  fabText: { color: Colors.text, fontSize: 28, lineHeight: 32, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing[6], maxHeight: '85%' },
  modalTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizes.xl, color: Colors.text, marginBottom: Spacing[4] },
  input: { backgroundColor: Colors.surfaceHigh, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: Spacing[4], color: Colors.text, fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, marginBottom: Spacing[3] },
  textarea: { height: 100 },
  modalActions: { flexDirection: 'row', gap: Spacing[3], marginTop: Spacing[2] },
  cancelBtn: { flex: 1, backgroundColor: Colors.surfaceHigh, borderRadius: 10, paddingVertical: Spacing[4], alignItems: 'center' },
  cancelBtnText: { fontFamily: Typography.fontBodyBold, fontSize: Typography.sizes.base, color: Colors.textMuted },
  submitBtn: { flex: 1, backgroundColor: Colors.accent, borderRadius: 10, paddingVertical: Spacing[4], alignItems: 'center' },
  submitBtnText: { fontFamily: Typography.fontBodyBold, fontSize: Typography.sizes.base, color: Colors.text },
});
