import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, R } from './theme';

const TABS = [
  { route: '/(creator)/feed',          icon: '⚡',  label: 'Feed'    },
  { route: '/(creator)/opportunities', icon: '🎯',  label: 'Deals'   },
  { route: '/(creator)/create',        icon: '+',   label: 'Create', special: true },
  { route: '/(creator)/profile',       icon: '👤',  label: 'Profile' },
];

// The pathname expo-router reports for /(creator)/feed is just "/feed" (group stripped)
const toSegment = (route) => route.replace('/(creator)', '');

export default function BottomNav() {
  const router = useRouter();
  const path   = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={s.bar}>
        {TABS.map(tab => {
          const segment = toSegment(tab.route);
          const active  = path === segment || path.startsWith(segment + '/');
          if (tab.special) {
            return (
              <TouchableOpacity key={tab.route} style={s.specialWrap} onPress={() => router.push(tab.route)} activeOpacity={0.85}>
                <View style={[s.specialBtn, active && s.specialBtnActive]}>
                  <Text style={s.specialIcon}>{tab.icon}</Text>
                </View>
                <Text style={[s.specialLabel, active && s.specialLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity key={tab.route} style={s.tab} onPress={() => router.push(tab.route)} activeOpacity={0.7}>
              <Text style={[s.icon, active && s.iconActive]}>{tab.icon}</Text>
              <Text style={[s.label, active && s.labelActive]}>{tab.label}</Text>
              {active && <View style={s.dot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:             { position: 'absolute', bottom: 0, left: 0, right: 0 },
  bar:              { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: 'rgba(10,10,15,0.97)', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10, paddingHorizontal: 8 },
  tab:              { flex: 1, alignItems: 'center', paddingBottom: 4, gap: 3, position: 'relative' },
  icon:             { fontSize: 22, opacity: 0.4 },
  iconActive:       { opacity: 1 },
  label:            { color: C.textFaint, fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  labelActive:      { color: C.accent },
  dot:              { position: 'absolute', top: -2, width: 4, height: 4, borderRadius: 2, backgroundColor: C.accent },
  specialWrap:      { flex: 1, alignItems: 'center', gap: 3, paddingBottom: 4 },
  specialBtn:       { width: 46, height: 46, borderRadius: 23, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', marginTop: -18, shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 12, elevation: 10 },
  specialBtnActive: { shadowOpacity: 0.9 },
  specialIcon:      { color: '#fff', fontSize: 24, fontWeight: '900', lineHeight: 28 },
  specialLabel:     { color: C.accent, fontSize: 10, fontWeight: '700' },
  specialLabelActive: { color: C.text },
});
