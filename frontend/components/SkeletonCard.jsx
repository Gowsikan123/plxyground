import { View, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { C, R } from './theme';

export default function SkeletonCard() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <Animated.View style={[s.card, { opacity }]}>
      <View style={s.img} />
      <View style={s.body}>
        <View style={s.row}>
          <View style={s.avatar} />
          <View style={s.nameLine} />
        </View>
        <View style={s.titleLine} />
        <View style={s.titleLineShort} />
        <View style={s.textLine} />
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card:          { backgroundColor: C.surface, borderRadius: R.xl, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  img:           { width: '100%', height: 200, backgroundColor: C.surface2 },
  body:          { padding: 16, gap: 10 },
  row:           { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:        { width: 28, height: 28, borderRadius: 14, backgroundColor: C.surface3 },
  nameLine:      { width: 100, height: 12, borderRadius: 6, backgroundColor: C.surface3 },
  titleLine:     { width: '90%', height: 16, borderRadius: 8, backgroundColor: C.surface3 },
  titleLineShort:{ width: '60%', height: 16, borderRadius: 8, backgroundColor: C.surface3 },
  textLine:      { width: '75%', height: 12, borderRadius: 6, backgroundColor: C.surface3 },
});
