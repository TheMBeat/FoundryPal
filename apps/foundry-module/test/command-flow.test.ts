import { describe, expect, it, vi } from 'vitest';
import { BridgeService } from '../src/services/bridge-service.js';
import { InMemoryBridgeTransport } from '../src/services/transport.js';
import { makeActor, makeGame, makeItem } from './test-helpers.js';

describe('Bridge command flow', () => {
  it('handles updateHP and returns ack envelope', async () => {
    const game = makeGame();
    const bridge = new BridgeService(game, new InMemoryBridgeTransport(), { sessionTtlMs: 10_000 });
    const session = bridge.openSessionForUser('user1');
    if (!('sessionId' in session)) throw new Error('session failed');

    const result = await bridge.handleCommand(session.sessionId, {
      requestId: 'req-1',
      command: 'updateHP',
      actorHintId: 'actor-1',
      payload: { delta: -4 },
    });

    expect(result.type).toBe('commandResult');
    expect((result.payload as any).ok).toBe(true);
  });

  it('blocks unauthorized actor access', async () => {
    const otherActor = makeActor({ id: 'actor-2', ownership: { user2: 3 } });
    const game = makeGame(otherActor);
    const bridge = new BridgeService(game, new InMemoryBridgeTransport(), { sessionTtlMs: 10_000 });
    const session = bridge.openSessionForUser('user1');
    if (!('sessionId' in session)) throw new Error('session failed');

    const result = await bridge.handleCommand(session.sessionId, {
      requestId: 'req-2',
      command: 'updateHP',
      actorHintId: 'actor-2',
      payload: { delta: -1 },
    });

    expect(result.type).toBe('error');
    expect((result.payload as any).code).toBe('NOT_FOUND');
  });

  it('rate limits sendChatMessage', async () => {
    const game = makeGame(makeActor({ items: [makeItem()] }));
    (globalThis as any).ChatMessage = { create: vi.fn(async () => ({})) };
    const bridge = new BridgeService(game, new InMemoryBridgeTransport(), { sessionTtlMs: 10_000 });
    const session = bridge.openSessionForUser('user1');
    if (!('sessionId' in session)) throw new Error('session failed');

    for (let i = 0; i < 5; i += 1) {
      await bridge.handleCommand(session.sessionId, {
        requestId: `chat-${i}`,
        command: 'sendChatMessage',
        payload: { content: 'hello', inCharacter: true },
      });
    }

    const blocked = await bridge.handleCommand(session.sessionId, {
      requestId: 'chat-6',
      command: 'sendChatMessage',
      payload: { content: 'blocked', inCharacter: true },
    });

    expect(blocked.type).toBe('error');
    expect((blocked.payload as any).code).toBe('RATE_LIMITED');
  });
});
