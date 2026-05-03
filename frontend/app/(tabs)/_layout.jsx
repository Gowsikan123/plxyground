// (tabs) group is deprecated — all routing lives in (creator) and (business).
// This file is kept as a shell so Expo Router does not throw on old deep-links.
import { Redirect } from 'expo-router';
export default function TabsLayout() {
  return <Redirect href="/(creator)/feed" />;
}
