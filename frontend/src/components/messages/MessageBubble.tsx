'use client';

import type { Message } from '@scentresort/shared';

interface Props {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: Props) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 ${
          isOwn
            ? 'bg-foreground text-background'
            : 'bg-background-card border border-border text-foreground'
        }`}
      >
        {!isOwn && (
          <p className="text-[10px] font-bold mb-1 text-foreground-muted uppercase tracking-[0.15em]">
            {message.senderDisplayName}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="Attachment"
            className="mt-2 max-h-60 object-cover"
          />
        )}
      </div>
    </div>
  );
}
