import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { OpportunityCard } from '../../components/opportunities/OpportunityCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { Toast } from '../../components/ui/Toast';
import { Input } from '../../components/ui/Input';
import { Text } from 'react-native';
import { getOpportunities, createOpportunity } from '../../services/opportunityService';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

export default function BusinessOpportunities() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', sport: '', location: '', budget: '', deadline: '' });
  const [posting, setPosting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const load = async () => {
    setLoading(true);
    const { data } = await getOpportunities(1);
    if (data) setItems(data.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handlePost = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setToast({ visible: true, message: 'Title and description are required.', type: 'error' });
      return;
    }
    setPosting(true);
    const { error } = await createOpportunity(form);
    setPosting(false);
    if (error) { setToast({ visible: true, message: error, type: 'error' }); return; }
    setShowForm(false);
    setForm({ title: '', description: '', sport: '', location: '', budget: '', deadline: '' });
    setToast({ visible: true, message: 'Opportunity posted!', type: 'success' });
    load();
  };

  return (
    <View style={styles.page}>
      <Header title="Opportunities" right={<Button title="+ New" onPress={() => setShowForm((v) => !v)} variant="ghost" style={styles.newBtn} />} />
      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Post Opportunity</Text>
          <Input label="Title *" value={form.title} onChangeText={set('title')} />
          <Input label="Description *" value={form.description} onChangeText={set('description')} multiline numberOfLines={4} />
          <Input label="Sport" value={form.sport} onChangeText={set('sport')} />
          <Input label="Location" value={form.location} onChangeText={set('location')} />
          <Input label="Budget" value={form.budget} onChangeText={set('budget')} />
          <Input label="Deadline" value={form.deadline} onChangeText={set('deadline')} placeholder="e.g. 2025-12-31" />
          <Button title="Post" onPress={handlePost} loading={posting} />
        </View>
      )}
      {loading ? (
        <View style={{ padding: Spacing[4] }}>{[1, 2].map((k) => <SkeletonCard key={k} />)}</View>
      ) : items.length === 0 ? (
        <EmptyState title="No opportunities yet" message="Post your first opportunity above." />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => <OpportunityCard item={item} />}
          estimatedItemSize={140}
          contentContainerStyle={{ padding: Spacing[4] }}
        />
      )}
      <Toast message={toast.message} visible={toast.visible} type={toast.type} onHide={() => setToast({ visible: false, message: '', type: 'error' })} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.bg },
  newBtn: { paddingHorizontal: 0 },
  form: { padding: Spacing[4], gap: Spacing[3], borderBottomWidth: 1, borderBottomColor: Colors.border },
  formTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizes.lg, color: Colors.text },
});
