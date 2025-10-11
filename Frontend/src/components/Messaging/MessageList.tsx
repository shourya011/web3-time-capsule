// Frontend/src/components/Messaging/MessageList.tsx
import React from 'react';
import { Message } from '@/types/messaging';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';

export const MessageList: React.FC<{ messages: Message[], currentAddress?: string }> = ({ messages, currentAddress }) => {
  return (
    <div className="space-y-3 overflow-y-auto max-h-72 p-2">
      {messages.map(m => (
        <div key={m.id} className={`flex gap-3 ${m.from.toLowerCase() === currentAddress?.toLowerCase() ? 'justify-end' : ''}`}>
          {m.from.toLowerCase() !== currentAddress?.toLowerCase() && (
            <Avatar className="w-8 h-8">
              <AvatarFallback>
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
          )}

          <div className={`${m.from.toLowerCase() === currentAddress?.toLowerCase() ? 'bg-primary/80 text-white' : 'bg-muted/60'} rounded-lg p-3 max-w-[70%]`}>
            <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
            <div className="text-xs text-muted-foreground mt-1">{new Date(m.timestamp).toLocaleString()}</div>
          </div>

          {m.from.toLowerCase() === currentAddress?.toLowerCase() && (
            <Avatar className="w-8 h-8">
              <AvatarFallback>
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      ))}
    </div>
  );
};
