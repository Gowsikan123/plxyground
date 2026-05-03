import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal, Pressable, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { OpportunityCard } from '../../components/opportunities/OpportunityCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { Toast } from '../../components/ui/Toast';
import { Input } from '../../components/ui/Input';
import { getMyOpportunities, createOpportunity, updateOpportunity } from '../../services/opportunityService';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';

export default function BusinessOpportunities() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', sport: '', location: '', budget: '', deadline: '' });
  const [posting, setPosting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  const load = async () => {
    setLoading(true);
    const { data, error } = await getMyOpportunities();
    if (error) {
      setToast({ visible: true, message: error, type: 'error' });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handlePost = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setToast({ visible: true, message: 'Title and description are required.', type: 'error' });
      return;
    }
    setPosting(true);
    const { error } = await createOpportunity(form);
    setPosting(false);
    if (error) {
      setToast({ visible: true, message: error, type: 'error' });
      return;
    }
    setShowForm(false);
    setForm({ title: '', description: '', sport: '', location: '', budget: '', deadline: '' });
    setToast({ visible: true, message: 'Opportunity posted.', type: 'success' });
    load();
  };

  const handleCloseOpportunity = async () => {
    if (!selectedItem) return;
    const { error } = await updateOpportunity(selectedItem.id, { status: 'closed' });
    if (error) {
      setToast({ visible: true, message: error, type: 'error' });
      return;
    }
    setSelectedItem(null);
    setToast({ visible: true, message: 'Opportunity closed.', type: 'success' });
    load();
  };

  return (
    <View style={styles.page}>
      <Header title="Opportunities" right={<Button title="+ New" onPress={() => setShowForm((value) => !value)} variant="ghost" style={styles.newBtn} />} />
      {showForm ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Post Opportunity</Text>
          <Input label="Title *" value={form.title} onChangeText={set('title')} />
          <Input label="Description *" value={form.description} onChangeText={set('description')} multiline numberOfLines={4} />
          <Input label="Sport" value={form.sport} onChangeText={set('sport')} />
          <Input label="Location" value={form.location} onChangeText={set('location')} />
          <Input label="Budget" value={form.budget} onChangeText={set('budget')} />
          <Input label="Deadline" value={form.deadline} onChangeText={set('deadline')} placeholder="e.g. 31 May 2026" />
          <Button title="Post" onPress={handlePost} loading={posting} />
        </View>
      ) : null}
      {loading ? (
        <View style={{ padding: Spacing[4] }}>{[1, 2].map((key) => <SkeletonCard key={key} />)}</View>
      ) : items.length === 0 ? (
        <EmptyState title="No opportunities yet" message="Post your first opportunity above." />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <OpportunityCard item={item} onPress={() => setSelectedItem(item)} />}
          estimatedItemSize={140}
          contentContainerStyle={{ padding: Spacing[4] }}
          onRefresh={load}
          refreshing={loading}
        />
      )}
      <Modal visible={Boolean(selectedItem)} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setSelectedItem(null)}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedItem?.title}</Text>
            <Text style={styles.modalText}>{selectedItem?.description}</Text>
            {selectedItem?.budget ? <Text style={styles.modalText}>Budget: {selectedItem.budget}</Text> : null}
            {selectedItem?.location ? <Text style={styles.modalText}>Location: {selectedItem.location}</Text> : null}
            {selectedItem?.deadline ? <Text style={styles.modalText}>Deadline: {selectedItem.deadline}</Text> : null}
            {selectedItem?.status !== 'closed' ? <Button title="Close Opportunity" onPress={handleCloseOpportunity} variant="secondary" /> : null}
          </Pressable>
        </Pressable>
      </Modal>
      <Toast message={toast.message} visible={toast.visible} type={toast.type} onHide={() => setToast({ visible: false, message: '', type: 'error' })} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.bg },
  newBtn: { paddingHorizontal: 0 },
  form: { padding: Spacing[4], gap: Spacing[3], borderBottomWidth: 1, borderBottomColor: Colors.border },
  formTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizes.lg, color: Colors.text },
  overlay: { flex: 1, backgroundColor: Colors.overlay, alignItems: 'center', justifyContent: 'center', padding: Spacing[4] },
  modalCard: { width: '100%', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing[4], gap: Spacing[3], borderWidth: 1, borderColor: Colors.border },
  modalTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizes.xl, color: Colors.text },
  modalText: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, color: Colors.textMuted },
});
