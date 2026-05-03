// Root-level feed.jsx — redirects to the canonical (creator) feed.
// Previously this file caused Expo Router to serve a different component
// depending on whether the page was navigated-to or refreshed directly.
import { Redirect } from 'expo-router';
export default function FeedRedirect() {
  return <Redirect href="/(creator)/feed" />;
}
