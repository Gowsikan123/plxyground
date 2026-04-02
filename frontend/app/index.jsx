import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, StatusBar, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

export default function Landing() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1546519638405-a9f5a95a5b64?w=1200' }}
        style={styles.bg}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(8,12,20,0.3)', 'rgba(8,12,20,0.7)', 'rgba(8,12,20,0.97)']}
          style={styles.gradient}
          locations={[0, 0.5, 1]}
        >
          <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

            <View style={styles.top}>
              <View style={styles.logoWrap}>
                <Text style={styles.logo}>PLX</Text>
                <View style={styles.logoDot} />
                <Text style={styles.logo}>GROUND</Text>
              </View>
              <Text style={styles.logoSub}>SPORTS CREATOR PLATFORM</Text>
            </View>

            <View style={styles.middle}>
              <Text style={styles.headline}>Where Creators{'\n'}Meet Brands</Text>
              <Text style={styles.sub}>Build your brand. Find partnerships.{'\n'}Grow your sports audience.</Text>

              <View style={styles.trustRow}>
                {['🏀', '⚽', '🏈', '🎾', '🏊'].map((emoji, i) => (
                  <View key={i} style={styles.trustBadge}>
                    <Text style={styles.trustEmoji}>{emoji}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.bottom}>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => router.push('/signup')}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#3b82f6', '#2563eb', '#1d4ed8']}
                  style={styles.btnGradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.btnPrimaryText}>Get Started — Free</Text>
                  <Text style={styles.btnArrow}>→</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => router.push('/business-signup')}
                activeOpacity={0.85}
              >
                <Text style={styles.btnSecondaryText}>🏢  I'm a Business</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginRow}
                onPress={() => router.push('/login')}
                activeOpacity={0.7}
              >
                <Text style={styles.loginText}>Already have an account? </Text>
                <Text style={styles.loginLink}>Sign in →</Text>
              </TouchableOpacity>

              <View style={styles.legalRow}>
                <TouchableOpacity onPress={() => router.push('/terms')}>
                  <Text style={styles.legalLink}>Terms</Text>
                </TouchableOpacity>
                <View style={styles.legalDot} />
                <TouchableOpacity onPress={() => router.push('/privacy')}>
                  <Text style={styles.legalLink}>Privacy</Text>
                </TouchableOpacity>
              </View>
            </View>

          </Animated.View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: '100%' },
  bg: { width: '100%', minHeight: '100%' },
  gradient: { flex: 1, minHeight: '100%', paddingTop: 60, paddingHorizontal: 28, paddingBottom: 48 },
  inner: { flex: 1, width: '100%', maxWidth: 560, justifyContent: 'space-between' },
  top: { alignItems: 'flex-start' },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  logo: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 4 },
  logoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3b82f6', marginHorizontal: 4, marginBottom: 2 },
  logoSub: { color: '#475569', fontSize: 9, letterSpacing: 3, marginTop: 4, fontWeight: '600' },
  middle: { gap: 16, width: '100%' },
  headline: { color: '#fff', fontSize: 42, fontWeight: '900', lineHeight: 50, letterSpacing: -0.5 },
  sub: { color: '#94a3b8', fontSize: 16, lineHeight: 26 },
  trustRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  trustBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  trustEmoji: { fontSize: 18 },
  bottom: { gap: 12 },
  btnPrimary: { borderRadius: 16, overflow: 'hidden', shadowColor: '#3b82f6', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, paddingHorizontal: 24, gap: 8 },
  btnPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
  btnArrow: { color: '#fff', fontSize: 18 },
  btnSecondary: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', paddingVertical: 17, borderRadius: 16, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  btnSecondaryText: { color: '#e2e8f0', fontWeight: '600', fontSize: 15 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 4 },
  loginText: { color: '#64748b', fontSize: 14 },
  loginLink: { color: '#3b82f6', fontSize: 14, fontWeight: '700' },
  legalRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  legalLink: { color: '#334155', fontSize: 12 },
  legalDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#334155' },
});
