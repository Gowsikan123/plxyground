import { Stack } from 'expo-router';
import { COLORS } from '../../constants/colors';

export default function BusinessLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_bottom',
      }}
    />
  );
}
