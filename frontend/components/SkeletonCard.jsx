import { View, StyleSheet, Animated, useEffect } from 'react-native';
import { useEffect as useEff, useRef } from 'react';
import { C, R } from './theme';

export default function SkeletonCard() {
  const anim = useRef(new Animated.Value(0)).current;

  useEff(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  const Bone = ({ style }) => (
    <Animated.View style={[styles.bone, { opacity }, style]} />
  );

  return (
    <View style={styles.card}>
      <Bone style={styles.img} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Bone style={styles.avatar} />
          <Bone style={styles.name} />
        </View>
        <Bone style={styles.title} />
        <Bone style={styles.titleShort} />
        <Bone style={styles.text} />
        <Bone style={styles.textShort} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card:       { backgroundColor: C.surface, borderRadius: R.xl, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  bone:       { backgroundColor: C.surface2, borderRadius: R.sm },
  img:        { width: '100%', height: 200 },
  body:       { padding: 18, gap: 10 },
  row:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:     { width: 30, height: 30, borderRadius: 15 },
  name:       { width: 120, height: 13 },
  title:      { width: '90%', height: 20 },
  titleShort: { width: '60%', height: 20 },
  text:       { width: '100%', height: 13 },
  textShort:  { width: '70%', height: 13 },
});
