import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/tokens';

/** Round profile picture, falling back to the person's initials. */
export function Avatar({ url, name, size = 40 }: { url?: string | null; name?: string | null; size?: number }) {
  const initials = (name ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  const shape = { width: size, height: size, borderRadius: size / 2 };

  if (url) {
    return <Image source={{ uri: url }} style={shape} contentFit="cover" accessibilityLabel={name ?? 'Profile photo'} />;
  }
  return (
    <View style={[styles.fallback, shape]} accessibilityLabel={name ?? 'Profile photo'}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.textMuted, fontWeight: '700' },
});
