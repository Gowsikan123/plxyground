import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../components/AuthContext';
import { useEffect } from 'react';
import { C, R, S, GRAD_ACCENT, GRAD_HERO } from '../components/theme';

const { width, height } = Dimensions.get('window');

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'BUSINESS') router.replace('/business/dashboard');
      else router.replace('/feed');
    }
  }, [user, loading]);

  if (loading) return <View style={s.container} />;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Ambient background blobs */}
      <View style={s.blobTL} />
      <View style={s.blobBR} />
      <View style={s.blobMid} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} bounces={false}>
        {/* Brand mark */}
        <View style={s.brandRow}>
          <LinearGradient colors={GRAD_HERO} style={s.logoMark} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={s.logoMarkText}>PX</Text>
          </LinearGradient>
          <View>
            <Text style={s.logoText}>PLXYGROUND</Text>
            <Text style={s.logoSub}>Sports Creator Network</Text>
          </View>
        </View>

        {/* Hero headline */}
        <View style={s.hero}>
          <Text style={s.heroLine1}>Where Sports</Text>
          <View style={s.heroAccentRow}>
            <LinearGradient colors={GRAD_HERO} style={s.heroAccentPill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.heroAccentText}>Creators</Text>
            </LinearGradient>
          </View>
          <Text style={s.heroLine3}>Thrive.</Text>
          <Text style={s.heroSub}>
            Connect with brands, share your story, unlock real opportunities in sports.
          </Text>
        </View>

        {/* Stats strip */}
        <View style={s.statsRow}>
          {[
            { num: '200+', label: 'Creators' },
            { num: '50+',  label: 'Brands'   },
            { num: '£££',  label: 'Real Deals'},
          ].map((stat, i) => (
            <View key={i} style={s.stat}>
              <Text style={s.statNum}>{stat.num}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View style={s.ctas}>
          <TouchableOpacity style={s.primaryWrap} onPress={() => router.push('/signup')} activeOpacity={0.88}>
            <LinearGradient colors={GRAD_HERO} style={s.primaryBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.primaryBtnText}>Join as Creator  →</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.secondaryBtn} onPress={() => router.push('/login')} activeOpacity={0.8}>
            <Text style={s.secondaryBtnText}>I already have an account</Text>
          </TouchableOpacity>
        </View>

        {/* Business entry */}
        <TouchableOpacity style={s.bizCard} onPress={() => router.push('/business-login')} activeOpacity={0.85}>
          <View style={s.bizLeft}>
            <Text style={s.bizIcon}>🏢</Text>
            <View>
              <Text style={s.bizTitle}>Are you a Brand?</Text>
              <Text style={s.bizSub}>Post deals & find creators</Text>
            </View>
          </View>
          <Text style={s.bizArrow}>→</Text>
        </TouchableOpacity>

        {/* Legal */}
        <View style={s.legal}>
          <TouchableOpacity onPress={() => router.push('/terms')}>
            <Text style={s.legalLink}>Terms</Text>
          </TouchableOpacity>
          <Text style={s.legalDot}>·</Text>
          <TouchableOpacity onPress={() => router.push('/privacy')}>
            <Text style={s.legalLink}>Privacy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg },
  blobTL:          { position: 'absolute', top: -60, left: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,77,109,0.12)' },
  blobBR:          { position: 'absolute', bottom: 80, right: -80, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(191,95,255,0.10)' },
  blobMid:         { position: 'absolute', top: height * 0.4, left: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(170,255,0,0.06)' },
  scroll:          { paddingHorizontal: 24, paddingTop: 68, paddingBottom: 40 },
  brandRow:        { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 48 },
  logoMark:        { width: 52, height: 52, borderRadius: R.lg, alignItems: 'center', justifyContent: 'center' },
  logoMarkText:    { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  logoText:        { color: C.text, fontSize: 15, fontWeight: '900', letterSpacing: 3.5 },
  logoSub:         { color: C.textMuted, fontSize: 11, marginTop: 2, letterSpacing: 0.5 },
  hero:            { marginBottom: 36 },
  heroLine1:       { color: C.text, fontSize: 50, fontWeight: '900', letterSpacing: -1.5, lineHeight: 56 },
  heroAccentRow:   { marginVertical: 4 },
  heroAccentPill:  { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: R.lg },
  heroAccentText:  { color: '#fff', fontSize: 50, fontWeight: '900', letterSpacing: -1.5 },
  heroLine3:       { color: C.text, fontSize: 50, fontWeight: '900', letterSpacing: -1.5, lineHeight: 60, marginBottom: 16 },
  heroSub:         { color: C.textMuted, fontSize: 16, lineHeight: 26 },
  statsRow:        { flexDirection: 'row', backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, marginBottom: 32, overflow: 'hidden' },
  stat:            { flex: 1, alignItems: 'center', paddingVertical: 18, borderRightWidth: 1, borderRightColor: C.border },
  statNum:         { color: C.accent, fontSize: 20, fontWeight: '900', marginBottom: 2 },
  statLabel:       { color: C.textMuted, fontSize: 11, fontWeight: '600' },
  ctas:            { gap: 12, marginBottom: 20 },
  primaryWrap:     { borderRadius: R.xl, overflow: 'hidden' },
  primaryBtn:      { paddingVertical: 20, alignItems: 'center', borderRadius: R.xl },
  primaryBtnText:  { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.2 },
  secondaryBtn:    { paddingVertical: 18, alignItems: 'center', borderRadius: R.xl, borderWidth: 1, borderColor: C.borderBright, backgroundColor: C.surface },
  secondaryBtnText:{ color: C.text, fontSize: 16, fontWeight: '700' },
  bizCard:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.surface2, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, padding: 18, marginBottom: 28 },
  bizLeft:         { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bizIcon:         { fontSize: 28 },
  bizTitle:        { color: C.text, fontSize: 15, fontWeight: '700' },
  bizSub:          { color: C.textMuted, fontSize: 12, marginTop: 2 },
  bizArrow:        { color: C.accent, fontSize: 20, fontWeight: '700' },
  legal:           { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  legalLink:       { color: C.textFaint, fontSize: 12 },
  legalDot:        { color: C.textFaint, fontSize: 12 },
});
