import React from 'react';
import { View } from 'react-native';
import { Header } from '../../components/layout/Header';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../constants/colors';

export default function MyContent() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <Header title="My Content" />
      <EmptyState title="No content yet" message="Content you submit will appear here after review." />
    </View>
  );
}
