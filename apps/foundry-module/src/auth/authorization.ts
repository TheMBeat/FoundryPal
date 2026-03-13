import type { CompanionUserSession, ErrorResponse } from '@foundrypal/shared';
import type { FoundryActorLike } from '../types/foundry.js';

export class AuthorizationService {
  ensureActorAccess(
    session: CompanionUserSession,
    actor: FoundryActorLike | undefined,
  ): { ok: true } | { ok: false; error: ErrorResponse } {
    if (!actor) {
      return {
        ok: false,
        error: { ok: false, code: 'NOT_FOUND', message: 'Actor was not found.' },
      };
    }

    if (!session.actorIds.includes(actor.id)) {
      return {
        ok: false,
        error: { ok: false, code: 'AUTH_ERROR', message: 'Actor is not available in this session.' },
      };
    }

    return { ok: true };
  }
}
