import { View, Text, StyleSheet, ScrollView, Pressable, Switch, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import Input from '../../components/ui/Input';

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

const Row = ({ label, value, onPress, destructive }) => (
  <Pressable style={styles.row} onPress={onPress}>
    <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>{label}</Text>
    {value && <Text style={styles.rowValue}>{value}</Text>}
  </Pressable>
);

export default function SettingsScreen() {
  const { user, logout, updateProfile, loading } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifs, setNotifs] = useState(true);

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({ display_name: displayName, bio });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Text style={styles.heading}>Settings</Text>

      <Section title="Profile">
        <Input label="Display Name" value={displayName} onChangeText={setDisplayName} />
        <Input label="Bio" value={bio} onChangeText={setBio} multiline numberOfLines={3} />
        <Pressable style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>{saved ? '✓ Saved' : 'Save Changes'}</Text>}
        </Pressable>
      </Section>

      <Section title="Notifications">
        <View style={styles.toggleRow}>
          <Text style={styles.rowLabel}>Push notifications</Text>
          <Switch value={notifs} onValueChange={setNotifs} trackColor={{ true: COLORS.primary }} />
        </View>
      </Section>

      <Section title="Account">
        <Row label="Privacy Policy" onPress={() => {}} />
        <Row label="Terms of Service" onPress={() => {}} />
        <Row label="Sign Out" onPress={logout} destructive />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { padding: SPACING[6], paddingTop: SPACING[14], paddingBottom: SPACING[20] },
  heading: { ...TYPOGRAPHY.displaySm, color: COLORS.text, marginBottom: SPACING[8] },
  section: { marginBottom: SPACING[8] },
  sectionTitle: { ...TYPOGRAPHY.labelMd, color: COLORS.textMuted, letterSpacing: 1, marginBottom: SPACING[3] },
  sectionBody: { gap: SPACING[3] },
  row: { paddingVertical: SPACING[4], borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { ...TYPOGRAPHY.bodyMd, color: COLORS.text },
  rowLabelDestructive: { color: COLORS.error },
  rowValue: { ...TYPOGRAPHY.bodySm, color: COLORS.textMuted },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING[2] },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: SPACING[3], alignItems: 'center', marginTop: SPACING[2] },
  saveBtnText: { ...TYPOGRAPHY.labelMd, color: '#fff' },
});
