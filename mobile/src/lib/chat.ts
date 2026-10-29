import { router } from 'expo-router';
import { messages } from '@/api/endpoints';
import type { ReportTarget, Role } from '@/api/types';

/** Navigates to a conversation; the other person's details power the report/block menu. */
export function goToChat(threadId: number, other: { type: Role; id: number; name: string }) {
  router.push({
    pathname: '/chat/[threadId]',
    params: { threadId: String(threadId), name: other.name, otherType: other.type, otherId: String(other.id) },
  });
}

/** Opens (or creates) the conversation with someone and navigates to it. */
export async function openChat(recipientType: Role, recipientId: number, name: string) {
  const thread = await messages.open(recipientType, recipientId);
  goToChat(thread.id, { type: recipientType, id: recipientId, name });
}

/** Opens the report form for a person, post, opportunity or message. */
export function openReport(targetType: ReportTarget, targetId: number, name?: string) {
  router.push({ pathname: '/report', params: { targetType, targetId: String(targetId), name } });
}
