import {
  BridgeEnvelopeSchema,
  type BridgeEnvelope,
  type BridgeTransport,
  type CompanionUserSession,
  type ErrorResponse,
} from '@foundrypal/shared';
import { Dnd5eAdapter } from '../adapters/dnd5e-adapter.js';
import { AuthorizationService } from '../auth/authorization.js';
import { SessionService } from '../auth/session.js';
import { CommandHandlers } from '../commands/handlers.js';
import { ChatRateLimiter } from './rate-limit.js';
import type { FoundryGameLike } from '../types/foundry.js';

export interface BridgeConfig {
  sessionTtlMs: number;
}

export class BridgeService {
  private readonly sessionService: SessionService;
  private readonly adapter = new Dnd5eAdapter();
  private readonly authorization = new AuthorizationService();
  private readonly rateLimiter = new ChatRateLimiter(5, 10000);
  private readonly handlers: CommandHandlers;

  constructor(
    private readonly game: FoundryGameLike,
    private readonly transport: BridgeTransport,
    config: BridgeConfig,
  ) {
    this.sessionService = new SessionService({ ttlMs: config.sessionTtlMs });
    this.handlers = new CommandHandlers(this.game, this.adapter, this.authorization, this.rateLimiter);
  }

  openSessionForUser(userId: string): CompanionUserSession | ErrorResponse {
    const user = this.game.users.get(userId);
    if (!user) return { ok: false, code: 'AUTH_ERROR', message: 'Unknown Foundry user.' };

    const actorIds = Array.from(this.game.actors.values())
      .filter((actor) => (actor.ownership?.[user.id] ?? 0) >= 2)
      .map((actor) => actor.id);

    return this.sessionService.issueSession(user, actorIds);
  }

  async handleCommand(sessionId: string, command: unknown): Promise<BridgeEnvelope> {
    const session = this.sessionService.validateSession(sessionId);
    if (!session) {
      return this.errorEnvelope({ ok: false, code: 'AUTH_ERROR', message: 'Session invalid or expired.' });
    }

    const result = await this.handlers.execute(session, command);
    const envelope: BridgeEnvelope = {
      type: result.ok ? 'commandResult' : 'error',
      timestamp: new Date().toISOString(),
      correlationId: (command as any)?.requestId,
      payload: result,
    };

    await this.transport.publish(envelope);
    return envelope;
  }

  async publishSnapshot(session: CompanionUserSession): Promise<void> {
    const actors = session.actorIds
      .map((id) => this.game.actors.get(id))
      .filter((actor): actor is NonNullable<typeof actor> => Boolean(actor))
      .map((actor) => this.adapter.toActorSummary(actor));

    const chats = this.game.messages.contents
      .slice(-50)
      .map((msg) => this.adapter.toChatMessage(msg, this.game.users.get(msg.user?.id ?? '')?.name ?? 'Unknown'));

    const envelope = BridgeEnvelopeSchema.parse({
      type: 'snapshot',
      timestamp: new Date().toISOString(),
      payload: { actors, chats },
    });

    await this.transport.publish(envelope);
  }

  async publishActorUpdate(actorId: string): Promise<void> {
    const actor = this.game.actors.get(actorId);
    if (!actor) return;
    await this.transport.publish({
      type: 'event',
      timestamp: new Date().toISOString(),
      payload: { eventType: 'actorUpdated', actor: this.adapter.toActorDetail(actor) },
    });
  }

  async publishChatMessage(chatId: string): Promise<void> {
    const message = this.game.messages.contents.find((msg) => msg.id === chatId);
    if (!message) return;

    await this.transport.publish({
      type: 'event',
      timestamp: new Date().toISOString(),
      payload: {
        eventType: 'chatCreated',
        chat: this.adapter.toChatMessage(message, this.game.users.get(message.user?.id ?? '')?.name ?? 'Unknown'),
      },
    });
  }

  private errorEnvelope(error: ErrorResponse): BridgeEnvelope {
    return { type: 'error', timestamp: new Date().toISOString(), payload: error };
  }
}
