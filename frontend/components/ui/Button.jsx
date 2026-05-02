import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

export function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, style, textStyle, icon }) {
  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity onPress={onPress} disabled={isDisabled} activeOpacity={0.8} style={[styles.base, isDisabled && styles.disabled, style]}>
        <LinearGradient colors={Colors.gradient.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradient}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={styles.row}>
              {icon && <View style={styles.iconWrap}>{icon}</View>}
              <Text style={[styles.primaryText, textStyle]}>{title}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'outline') {
    return (
      <TouchableOpacity onPress={onPress} disabled={isDisabled} activeOpacity={0.7} style={[styles.base, styles.outlineBase, isDisabled && styles.disabled, style]}>
        {loading ? (
          <ActivityIndicator color={Colors.primary} size="small" />
        ) : (
          <View style={styles.row}>
            {icon && <View style={styles.iconWrap}>{icon}</View>}
            <Text style={[styles.outlineText, textStyle]}>{title}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} disabled={isDisabled} activeOpacity={0.7} style={[styles.base, styles.ghostBase, isDisabled && styles.disabled, style]}>
      {loading ? (
        <ActivityIndicator color={Colors.textMuted} size="small" />
      ) : (
        <View style={styles.row}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={[styles.ghostText, textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 12, overflow: 'hidden' },
  gradient: { paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontSize: 16, fontFamily: 'Syne_700Bold', letterSpacing: 0.5 },
  outlineBase: { borderWidth: 1.5, borderColor: Colors.primary, paddingVertical: 13, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  outlineText: { color: Colors.primary, fontSize: 16, fontFamily: 'Syne_600SemiBold', letterSpacing: 0.5 },
  ghostBase: { paddingVertical: 13, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  ghostText: { color: Colors.textMuted, fontSize: 15, fontFamily: 'DMSans_400Regular' },
  disabled: { opacity: 0.45 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { marginRight: 8 },
});
