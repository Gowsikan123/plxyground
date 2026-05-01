import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { C, R, S, GRAD_ACCENT } from './theme';

const TABS = [
  { label: 'Feed',    icon: '⚡',  route: '/feed'          },
  { label: 'Opps',   icon: '🎯',  route: '/opportunities'  },
  { label: null,     icon: '+',   route: '/create'         },
  { label: 'Profile',icon: '👤',  route: '/profile'        },
  { label: 'More',   icon: '⚙️',  route: '/settings'       },
];

export default function BottomNav() {
  const router   = useRouter();
  const segments = useSegments();
  const active   = '/' + (segments[0] || '');

  return (
    <View style={s.wrap}>
      {TABS.map((tab, i) => {
        const isActive  = active === tab.route;
        const isCreate  = tab.label === null;

        if (isCreate) return (
          <TouchableOpacity key={i} style={s.tab} onPress={() => router.push(tab.route)} activeOpacity={0.8}>
            <LinearGradient colors={GRAD_ACCENT} style={s.fab} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={s.fabIcon}>+</Text>
            </LinearGradient>
          </TouchableOpacity>
        );

        return (
          <TouchableOpacity key={i} style={s.tab} onPress={() => router.push(tab.route)} activeOpacity={0.7}>
            <Text style={[s.icon, isActive && s.iconActive]}>{tab.icon}</Text>
            <Text style={[s.label, isActive && s.labelActive]}>{tab.label}</Text>
            {isActive && <View style={s.dot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:        { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border, paddingBottom: 28, paddingTop: 10 },
  tab:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, position: 'relative' },
  icon:        { fontSize: 20, opacity: 0.4 },
  iconActive:  { opacity: 1 },
  label:       { color: C.textMuted, fontSize: 10, fontWeight: '600' },
  labelActive: { color: C.accent },
  dot:         { position: 'absolute', bottom: -10, width: 4, height: 4, borderRadius: 2, backgroundColor: C.accent },
  fab:         { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', shadowColor: C.accent, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  fabIcon:     { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
