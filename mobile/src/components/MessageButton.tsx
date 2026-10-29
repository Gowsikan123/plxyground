import { useState } from 'react';
import { Text } from 'react-native';
import { Button } from '@/components/ui';
import { openChat } from '@/lib/chat';
import { colors, type } from '@/theme/tokens';

/** "Message" button that opens (or starts) a conversation with someone. */
export function MessageButton({ recipientType, recipientId, name, label = 'Message' }: {
  recipientType: 'creator' | 'business';
  recipientId: number;
  name: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setBusy(true);
    setError(null);
    try {
      await openChat(recipientType, recipientId, name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open the conversation.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button label={label} variant="secondary" onPress={() => void open()} loading={busy} />
      {error ? <Text style={{ ...type.caption, color: colors.danger }}>{error}</Text> : null}
    </>
  );
}
