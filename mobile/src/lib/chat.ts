import { router } from 'expo-router';
import { messages } from '@/api/endpoints';

/** Opens (or creates) the conversation with someone and navigates to it. */
export async function openChat(recipientType: 'creator' | 'business', recipientId: number, name: string) {
  const thread = await messages.open(recipientType, recipientId);
  router.push({ pathname: '/chat/[threadId]', params: { threadId: String(thread.id), name } });
}
