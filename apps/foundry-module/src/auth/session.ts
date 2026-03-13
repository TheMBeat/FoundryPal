import { randomBytes } from 'node:crypto';
import type { CompanionUserSession } from '@foundrypal/shared';
import type { FoundryUserLike } from '../types/foundry.js';

export interface SessionConfig {
  ttlMs: number;
}

export class SessionService {
  private readonly sessions = new Map<string, CompanionUserSession>();

  constructor(private readonly config: SessionConfig) {}

  issueSession(user: FoundryUserLike, actorIds: string[]): CompanionUserSession {
    const sessionId = randomBytes(16).toString('hex');
    const now = Date.now();
    const session: CompanionUserSession = {
      sessionId,
      foundryUserId: user.id,
      username: user.name,
      role: user.isGM ? 'GAMEMASTER' : 'PLAYER',
      actorIds,
      issuedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + this.config.ttlMs).toISOString(),
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  validateSession(sessionId: string): CompanionUserSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (Date.parse(session.expiresAt) <= Date.now()) {
      this.sessions.delete(sessionId);
      return null;
    }
    return session;
  }
}
