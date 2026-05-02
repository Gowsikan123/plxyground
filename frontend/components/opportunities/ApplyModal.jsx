import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import Button from '../ui/Button';

export default function ApplyModal({ visible, opportunity, onClose, onSubmit, submitting }) {
  const [message, setMessage] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  function handleSubmit() {
    onSubmit({ message: message.trim(), portfolio_url: portfolioUrl.trim() });
  }

  function handleClose() {
    setMessage('');
    setPortfolioUrl('');
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Apply for Opportunity</Text>
          <TouchableOpacity onPress={handleClose} hitSlop={8} accessibilityLabel="Close">
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {opportunity ? (
            <Text style={styles.opportunityTitle}>{opportunity.title}</Text>
          ) : null}

          <Text style={styles.label}>Your message *</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Tell the business why you're the right fit..."
            placeholderTextColor={COLORS.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={1000}
            accessibilityLabel="Application message"
          />
          <Text style={styles.charCount}>{message.length}/1000</Text>

          <Text style={styles.label}>Portfolio URL (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://your-portfolio.com"
            placeholderTextColor={COLORS.textMuted}
            value={portfolioUrl}
            onChangeText={setPortfolioUrl}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Portfolio URL"
          />

          <Button
            label={submitting ? 'Submitting…' : 'Submit Application'}
            onPress={handleSubmit}
            disabled={!message.trim() || submitting}
            loading={submitting}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    ...TYPOGRAPHY.bodyMd,
    fontWeight: '700',
    color: COLORS.text,
  },
  body: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  opportunityTitle: {
    ...TYPOGRAPHY.bodyLg,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.labelMd,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  textarea: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.sm,
    ...TYPOGRAPHY.bodySm,
    color: COLORS.text,
    minHeight: 120,
  },
  charCount: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.sm,
    ...TYPOGRAPHY.bodySm,
    color: COLORS.text,
    height: 48,
  },
  submitBtn: {
    marginTop: SPACING.lg,
  },
});
