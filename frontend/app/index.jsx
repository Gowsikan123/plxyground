import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../components/AuthContext';
import { useEffect } from 'react';
import { C, R, S, GRAD_ACCENT, GRAD_GREEN } from '../components/theme';

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

      {/* Background ambient glow */}
      <View style={s.glowBlue} />
      <View style={s.glowGreen} />

      <View style={s.inner}>
        {/* Logo */}
        <View style={s.logoWrap}>
          <LinearGradient colors={GRAD_ACCENT} style={s.logoMark} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={s.logoMarkText}>P</Text>
          </LinearGradient>
          <View>
            <Text style={s.logoText}>PLXYGROUND</Text>
            <Text style={s.logoSub}>Sports Creator Network</Text>
          </View>
        </View>

        {/* Tagline */}
        <View style={s.heroWrap}>
          <Text style={s.heroTitle}>Where Sports{`\n`}Creators{' '}
            <Text style={s.heroAccent}>Thrive</Text>
          </Text>
          <Text style={s.heroSub}>
            Connect with brands, share your story, and unlock real opportunities in sports.
          </Text>
        </View>

        {/* Trust badges */}
        <View style={s.badges}>
          {['🏅 200+ Creators', '🤝 50+ Brands', '💰 Real Deals'].map(b => (
            <View key={b} style={s.badge}>
              <Text style={s.badgeText}>{b}</Text>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View style={s.ctas}>
          <TouchableOpacity style={s.primaryWrap} onPress={() => router.push('/signup')} activeOpacity={0.85}>
            <LinearGradient colors={GRAD_ACCENT} style={s.primaryBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.primaryBtnText}>Join as Creator</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.secondaryBtn} onPress={() => router.push('/login')} activeOpacity={0.8}>
            <Text style={s.secondaryBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Business link */}
        <TouchableOpacity style={s.bizLink} onPress={() => router.push('/business-login')}>
          <Text style={s.bizLinkText}>Are you a brand or business? </Text>
          <Text style={s.bizLinkAccent}>Enter here →</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom legal */}
      <View style={s.legal}>
        <TouchableOpacity onPress={() => router.push('/terms')}>
          <Text style={s.legalLink}>Terms</Text>
        </TouchableOpacity>
        <Text style={s.legalDot}>·</Text>
        <TouchableOpacity onPress={() => router.push('/privacy')}>
          <Text style={s.legalLink}>Privacy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg },
  glowBlue:       { position: 'absolute', top: height * 0.1, left: -80, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(79,126,255,0.08)' },
  glowGreen:      { position: 'absolute', top: height * 0.35, right: -100, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(34,197,94,0.06)' },
  inner:          { flex: 1, paddingHorizontal: 28, justifyContent: 'center', paddingTop: 60 },
  logoWrap:       { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 52 },
  logoMark:       { width: 48, height: 48, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
  logoMarkText:   { color: '#fff', fontSize: 26, fontWeight: '900' },
  logoText:       { color: C.text, fontSize: 17, fontWeight: '900', letterSpacing: 3 },
  logoSub:        { color: C.textMuted, fontSize: 11, marginTop: 2, letterSpacing: 0.5 },
  heroWrap:       { marginBottom: 32 },
  heroTitle:      { color: C.text, fontSize: 42, fontWeight: '900', lineHeight: 50, letterSpacing: -1, marginBottom: 16 },
  heroAccent:     { color: C.accent },
  heroSub:        { color: C.textMuted, fontSize: 16, lineHeight: 26 },
  badges:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 40 },
  badge:          { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: R.full },
  badgeText:      { color: C.textMuted, fontSize: 12, fontWeight: '600' },
  ctas:           { gap: 12, marginBottom: 20 },
  primaryWrap:    { borderRadius: R.lg, overflow: 'hidden' },
  primaryBtn:     { paddingVertical: 18, alignItems: 'center', borderRadius: R.lg },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  secondaryBtn:   { paddingVertical: 17, alignItems: 'center', borderRadius: R.lg, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  secondaryBtnText:{ color: C.text, fontSize: 16, fontWeight: '700' },
  bizLink:        { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  bizLinkText:    { color: C.textMuted, fontSize: 13 },
  bizLinkAccent:  { color: C.accent, fontSize: 13, fontWeight: '700' },
  legal:          { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingBottom: 32 },
  legalLink:      { color: C.textMuted, fontSize: 12 },
  legalDot:       { color: C.textFaint },
});
