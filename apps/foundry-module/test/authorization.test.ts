import { describe, expect, it } from 'vitest';
import { AuthorizationService } from '../src/auth/authorization.js';
import { makeActor } from './test-helpers.js';

describe('AuthorizationService', () => {
  const service = new AuthorizationService();

  it('denies actor not in session', () => {
    const result = service.ensureActorAccess(
      {
        sessionId: 's1',
        foundryUserId: 'u1',
        username: 'A',
        role: 'PLAYER',
        actorIds: ['other'],
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1000).toISOString(),
      },
      makeActor(),
    );

    expect(result.ok).toBe(false);
  });
});
