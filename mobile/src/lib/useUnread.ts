import { useQuery } from '@tanstack/react-query';
import { notifications } from '@/api/endpoints';

/** Unread notifications + messages, refreshed every 30 seconds for the Inbox badge. */
export function useUnread() {
  return useQuery({
    queryKey: ['unread'],
    queryFn: notifications.unread,
    refetchInterval: 30_000,
  });
}
