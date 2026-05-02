import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { api } from '../../services/api';

export default function CreatorProfileScreen() {
  const { id } = useLocalSearchParams();
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get(`/creators/${id}`);
        setCreator(data);
      } catch {
        setCreator(null);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#7c3aed" size="large" /></View>;
  }

  if (!creator) {
    return <View style={styles.center}><Text style={styles.notFound}>Creator not found.</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: `@${creator.username}`, headerStyle: { backgroundColor: '#0a0a0a' }, headerTintColor: '#fff' }} />
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{creator.username?.[0]?.toUpperCase() || '?'}</Text></View>
        <Text style={styles.username}>@{creator.username}</Text>
        {creator.bio && <Text style={styles.bio}>{creator.bio}</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', padding: 40 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  username: { color: '#fff', fontSize: 20, fontWeight: '700' },
  bio: { color: '#888', fontSize: 14, marginTop: 8, textAlign: 'center', maxWidth: 280 },
  notFound: { color: '#888', fontSize: 16 },
});
