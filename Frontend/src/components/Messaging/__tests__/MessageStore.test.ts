// Frontend/src/components/Messaging/__tests__/MessageStore.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { fetchThread, sendMessage, clearThread, markAsRead } from '../MessageStore';

const TEST_CAPSULE = 'test-capsule-1';

beforeEach(() => {
  clearThread(TEST_CAPSULE);
});

describe('MessageStore (localStorage adapter)', () => {
  it('should start with empty thread', async () => {
    const thread = await fetchThread(TEST_CAPSULE);
    expect(thread).toEqual([]);
  });

  it('should send and fetch a message', async () => {
    const created = await sendMessage({ capsuleId: TEST_CAPSULE, from: '0xA', to: '0xB', body: 'hello' });
    expect(created.id).toBeTruthy();
    expect(created.body).toBe('hello');

    const thread = await fetchThread(TEST_CAPSULE);
    expect(thread.length).toBe(1);
    expect(thread[0].body).toBe('hello');
  });

  it('should mark messages as read/delivered', async () => {
    await sendMessage({ capsuleId: TEST_CAPSULE, from: '0xA', to: '0xB', body: 'hello' });
    await markAsRead(TEST_CAPSULE, '0xB');
    const thread = await fetchThread(TEST_CAPSULE);
    expect(thread[0].status).toBe('delivered');
  });
});
