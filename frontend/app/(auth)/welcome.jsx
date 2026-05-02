import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Button } from '../../components/ui/Button';

export default function Welcome() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a0800', Colors.background]} style={styles.bg} />
      <View style={styles.hero}>
        <Text style={styles.logo}>PLXY</Text>
        <Text style={styles.logoAccent}>GROUND</Text>
        <Text style={styles.tagline}>Where athletes build their brand.</Text>
      </View>
      <View style={styles.actions}>
        <Button
          title="Join as Creator"
          onPress={() => router.push('/(auth)/creator-login')}
          variant="primary"
          style={styles.btn}
        />
        <Button
          title="Join as Business"
          onPress={() => router.push('/(auth)/business-login')}
          variant="outline"
          style={styles.btn}
        />
        <TouchableOpacity onPress={() => router.push('/(tabs)/feed')} style={styles.browse}>
          <Text style={styles.browseText}>Browse without account →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  bg: { ...StyleSheet.absoluteFillObject },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { color: Colors.text, fontSize: 64, fontFamily: 'Syne_700Bold', letterSpacing: -2 },
  logoAccent: { color: Colors.primary, fontSize: 32, fontFamily: 'Syne_700Bold', letterSpacing: 8, marginTop: -12 },
  tagline: { color: Colors.textMuted, fontSize: 14, fontFamily: 'DMSans_400Regular', marginTop: 16 },
  actions: { padding: 24, paddingBottom: 48, gap: 12 },
  btn: {},
  browse: { alignItems: 'center', paddingVertical: 12 },
  browseText: { color: Colors.textMuted, fontSize: 14, fontFamily: 'DMSans_400Regular' },
});
