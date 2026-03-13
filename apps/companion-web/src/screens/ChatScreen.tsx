import type { CompanionChatMessage } from '@foundrypal/shared';
import { useState } from 'react';

export function ChatScreen({
  chats,
  pendingCount,
  onSend,
  canSend,
}: {
  chats: CompanionChatMessage[];
  pendingCount: number;
  onSend: (message: string) => void;
  canSend: boolean;
}): JSX.Element {
  const [draft, setDraft] = useState('');

  return (
    <section className="chat-shell">
      <ul className="chat-list">
        {chats.map((message) => (
          <li key={message.id}><strong>{message.authorName}:</strong> {message.content}</li>
        ))}
      </ul>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.trim()) return;
          onSend(draft.trim());
          setDraft('');
        }}
      >
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={2} />
        <div className="row">
          <button type="submit" disabled={!canSend}>Send</button>
          {pendingCount > 0 && <span>Sending… ({pendingCount})</span>}
        </div>
      </form>
    </section>
  );
}
