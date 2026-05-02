import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import FeedList from '../../components/feed/FeedList';
import Header from '../../components/layout/Header';

export default function CreatorFeedScreen() {
  return (
    <View style={styles.container}>
      <Header title="PLXYGROUND" showNotifications />
      <FeedList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
});
