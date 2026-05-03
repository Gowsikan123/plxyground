import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, R } from './theme';

const TABS = [
  { route: '/(creator)/feed',          label: 'Feed',    icon: feedIcon    },
  { route: '/(creator)/opportunities', label: 'Deals',   icon: dealsIcon   },
  { route: '/(creator)/create',        label: 'Post',    icon: null,       special: true },
  { route: '/(creator)/profile',       label: 'Profile', icon: profileIcon },
];

function feedIcon(active) {
  // Simple SVG-style using View blocks — RN-safe
  return (
    <View style={[navIcons.bolt, active && navIcons.boltActive]}>
      <View style={navIcons.boltBar1} />
      <View style={navIcons.boltBar2} />
    </View>
  );
}

function dealsIcon(active) {
  return (
    <View style={navIcons.circle}>
      <View style={[navIcons.circleInner, active && navIcons.circleActive]} />
    </View>
  );
}

function profileIcon(active) {
  return (
    <View style={navIcons.profileWrap}>
      <View style={[navIcons.profileHead, active && navIcons.profileHeadActive]} />
      <View style={[navIcons.profileBody, active && navIcons.profileBodyActive]} />
    </View>
  );
}

const toSegment = (route) => route.replace('/(creator)', '');

export default function BottomNav() {
  const router = useRouter();
  const path   = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.wrap, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      {/* blurred frosted background line */}
      <View style={s.bar}>
        {TABS.map(tab => {
          const segment = toSegment(tab.route);
          const active  = path === segment || path.startsWith(segment + '/');

          if (tab.special) {
            return (
              <TouchableOpacity
                key={tab.route}
                style={s.specialWrap}
                onPress={() => router.push(tab.route)}
                activeOpacity={0.85}
              >
                <View style={s.specialBtn}>
                  <Text style={s.specialIcon}>+</Text>
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.route}
              style={s.tab}
              onPress={() => router.push(tab.route)}
              activeOpacity={0.7}
            >
              {/* Icon using emoji-free text glyphs */}
              <View style={s.iconWrap}>
                <Text style={[s.icon, active && s.iconActive]}>
                  {tab.label === 'Feed'    ? '⚡' :
                   tab.label === 'Deals'  ? '🎯' :
                   tab.label === 'Profile'? '○'  : '?'}
                </Text>
                {active && <View style={s.activePill} />}
              </View>
              <Text style={[s.label, active && s.labelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const navIcons = StyleSheet.create({
  bolt:             { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  boltBar1:         { width: 3, height: 14, backgroundColor: C.textFaint, borderRadius: 2, transform: [{ rotate: '20deg' }, { translateX: 2 }] },
  boltBar2:         { width: 3, height: 10, backgroundColor: C.textFaint, borderRadius: 2, transform: [{ rotate: '20deg' }, { translateX: -2 }] },
  boltActive:       { tintColor: C.accent },
  circle:           { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  circleInner:      { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: C.textFaint },
  circleActive:     { borderColor: C.accent },
  profileWrap:      { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', gap: 2 },
  profileHead:      { width: 10, height: 10, borderRadius: 5, backgroundColor: C.textFaint },
  profileHeadActive:{ backgroundColor: C.accent },
  profileBody:      { width: 16, height: 6, borderRadius: 8, backgroundColor: C.textFaint },
  profileBodyActive:{ backgroundColor: C.accent },
});

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // subtle gradient feel via layered shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 20,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,           // #111111 — clean dark panel
    borderTopWidth: 1,
    borderTopColor: C.borderBright,        // slightly visible divider
    paddingTop: 10,
    paddingHorizontal: 4,
  },

  // Regular tab
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 4,
    gap: 3,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 28,
    width: 48,
  },
  icon: {
    fontSize: 22,
    color: C.textFaint,
  },
  iconActive: {
    color: C.accent,
  },
  activePill: {
    position: 'absolute',
    bottom: -4,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.accent,
  },
  label: {
    color: C.textFaint,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  labelActive: {
    color: C.accent,
  },

  // Center create button
  specialWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
    paddingTop: 2,
  },
  specialBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    // glow effect
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 2,
    borderColor: C.accentAlt,
  },
  specialIcon: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 30,
    marginTop: -1,
  },
});
