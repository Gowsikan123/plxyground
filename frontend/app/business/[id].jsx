import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import SafeScreen from '../../components/layout/SafeScreen';
import ScreenHeader from '../../components/layout/ScreenHeader';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import OpportunityCard from '../../components/OpportunityCard';
import businessService from '../../services/businessService';

export default function BusinessProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [business, setBusiness] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data, error: err } = await businessService.getById(id);
        if (err) throw new Error(err);
        setBusiness(data.business);
        setOpportunities(data.opportunities || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <SafeScreen>
        <ScreenHeader title="Business" />
        <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>
      </SafeScreen>
    );
  }

  if (error || !business) {
    return (
      <SafeScreen>
        <ScreenHeader title="Business" />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || 'Not found'}</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <ScreenHeader title={business.business_name} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Avatar uri={business.logo_url} name={business.business_name} size={72} />
          <Text style={styles.name}>{business.business_name}</Text>
          {business.industry && <Badge label={business.industry} />}
          {business.bio && <Text style={styles.bio}>{business.bio}</Text>}
        </View>

        <Text style={styles.sectionTitle}>Open Opportunities</Text>
        {opportunities.length === 0 ? (
          <Text style={styles.empty}>No open opportunities.</Text>
        ) : (
          opportunities.map((o) => (
            <OpportunityCard
              key={o.id}
              opportunity={o}
              onPress={() => router.push(`/opportunity/${o.id}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: SPACING.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: COLORS.error, fontFamily: TYPOGRAPHY.fonts.body, fontSize: TYPOGRAPHY.sizes.base },
  hero: { alignItems: 'center', padding: SPACING.lg, gap: SPACING.sm },
  name: {
    fontFamily: TYPOGRAPHY.fonts.display,
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '800',
    color: COLORS.text,
  },
  bio: {
    fontFamily: TYPOGRAPHY.fonts.body,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
  },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.fonts.display,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  empty: {
    fontFamily: TYPOGRAPHY.fonts.body,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textMuted,
    textAlign: 'center',
    padding: SPACING.xl,
  },
});
