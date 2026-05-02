import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Header } from '../../components/layout/Header';
import { FeedList } from '../../components/feed/FeedList';
import { useFeed } from '../../hooks/useFeed';
import { Colors } from '../../constants/colors';

export default function Feed() {
  const { posts, isLoading, isRefreshing, error, hasMore, loadFeed } = useFeed();

  useEffect(() => {
    loadFeed(true);
  }, []);

  return (
    <View style={styles.page}>
      <Header title="PLXYGROUND" />
      <FeedList
        posts={posts}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        error={error}
        hasMore={hasMore}
        onRefresh={() => loadFeed(true)}
        onEndReached={() => loadFeed(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: Colors.bg } });
