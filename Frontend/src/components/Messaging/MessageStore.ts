// Frontend/src/components/Messaging/MessageStore.ts

import { Message } from '@/types/messaging';
import { nanoid } from 'nanoid';

const THREAD_KEY_PREFIX = 'messages_thread_';

// util to read/write thread from localStorage
function getThreadKey(capsuleId: string) {
  return `${THREAD_KEY_PREFIX}${capsuleId}`;
}

export async function fetchThread(capsuleId: string): Promise<Message[]> {
  const raw = localStorage.getItem(getThreadKey(capsuleId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Message[];
    // sort by timestamp asc
    parsed.sort((a, b) => a.timestamp - b.timestamp);
    return parsed;
  } catch (e) {
    console.error('Failed to parse thread', e);
    return [];
  }
}

export async function sendMessage(message: Omit<Message, 'id' | 'timestamp' | 'status'>): Promise<Message> {
  // optimistic creation
  const id = nanoid();
  const now = Date.now();
  const msg: Message = {
    id,
    timestamp: now,
    status: 'sent',
    ...message,
  };

  try {
    const key = getThreadKey(message.capsuleId);
    const current = (JSON.parse(localStorage.getItem(key) || '[]') as Message[]);
    current.push(msg);
    localStorage.setItem(key, JSON.stringify(current));

    // In a real implementation, send to server or IPFS here and update status accordingly.
    // TODO: implement delivery acknowledgement and status updates.

    return msg;
  } catch (e) {
    console.error('Failed to send message', e);
    const failedMsg: Message = { ...msg, status: 'failed' };
    const key = getThreadKey(message.capsuleId);
    const current = (JSON.parse(localStorage.getItem(key) || '[]') as Message[]);
    current.push(failedMsg);
    localStorage.setItem(key, JSON.stringify(current));
    return failedMsg;
  }
}

export async function markAsRead(capsuleId: string, address: string): Promise<void> {
  // For localStorage adapter, we could add a "readBy" array, but for MVP we'll just mark messages as delivered
  const key = getThreadKey(capsuleId);
  const current = (JSON.parse(localStorage.getItem(key) || '[]') as Message[]);
  const updated = current.map(m => ({ ...m, status: m.status === 'sent' ? 'delivered' : m.status }));
  localStorage.setItem(key, JSON.stringify(updated));
}

// Utility: clear thread (for tests)
export function clearThread(capsuleId: string) {
  localStorage.removeItem(getThreadKey(capsuleId));
}
