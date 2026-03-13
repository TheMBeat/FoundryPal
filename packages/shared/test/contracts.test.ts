import { describe, expect, it } from 'vitest';
import {
  CompanionActorDetailSchema,
  CompanionCommandSchema,
  CompanionUserSessionSchema,
  SendChatMessageCommandSchema,
  UpdateHPCommandSchema,
} from '../src/index.js';

describe('shared schema validation', () => {
  it('validates a minimal session DTO', () => {
    const session = CompanionUserSessionSchema.parse({
      sessionId: 'sess',
      foundryUserId: 'user1',
      username: 'Alice',
      role: 'PLAYER',
      actorIds: ['a1'],
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });
    expect(session.username).toBe('Alice');
  });

  it('rejects invalid actor detail DTO', () => {
    expect(() =>
      CompanionActorDetailSchema.parse({
        actorId: 'a1',
        name: 'Hero',
      }),
    ).toThrow();
  });

  it('validates command union', () => {
    const command = CompanionCommandSchema.parse({
      requestId: 'req-1',
      command: 'updateHP',
      payload: { delta: -5 },
    });
    expect(command.command).toBe('updateHP');
  });

  it('rejects chat message longer than 2000', () => {
    expect(() =>
      SendChatMessageCommandSchema.parse({
        requestId: 'req-2',
        command: 'sendChatMessage',
        payload: { content: 'x'.repeat(2001) },
      }),
    ).toThrow();
  });

  it('accepts hp delta integers only', () => {
    expect(() =>
      UpdateHPCommandSchema.parse({
        requestId: 'req-3',
        command: 'updateHP',
        payload: { delta: 1.2 },
      }),
    ).toThrow();
  });
});
