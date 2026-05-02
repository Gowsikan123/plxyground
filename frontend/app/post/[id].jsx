import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { api } from '../../services/api';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get(`/content/${id}`);
        setPost(data);
      } catch {
        setPost(null);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#7c3aed" size="large" /></View>;
  }

  if (!post) {
    return <View style={styles.center}><Text style={styles.notFound}>Post not found.</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: post.title || 'Post', headerStyle: { backgroundColor: '#0a0a0a' }, headerTintColor: '#fff' }} />
      <Text style={styles.username}>@{post.username || 'creator'}</Text>
      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.body}>{post.body}</Text>
      <Text style={styles.date}>{new Date(post.created_at).toLocaleString()}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 24 },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  username: { color: '#7c3aed', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 16, lineHeight: 30 },
  body: { color: '#ccc', fontSize: 16, lineHeight: 26 },
  date: { color: '#555', fontSize: 12, marginTop: 24 },
  notFound: { color: '#888', fontSize: 16 },
});
