import {
  CastSpellCommandSchema,
  CommandAckSchema,
  CompanionCommandSchema,
  SendChatMessageCommandSchema,
  SpendResourceCommandSchema,
  UpdateHPCommandSchema,
  UseItemCommandSchema,
  type CommandAck,
  type CompanionCommand,
  type CompanionUserSession,
  type ErrorResponse,
} from '@foundrypal/shared';
import { z } from 'zod';
import { Dnd5eAdapter } from '../adapters/dnd5e-adapter.js';
import { AuthorizationService } from '../auth/authorization.js';
import { ChatRateLimiter } from '../services/rate-limit.js';
import type { FoundryActorLike, FoundryGameLike, FoundryItemLike } from '../types/foundry.js';

export class CommandHandlers {
  constructor(
    private readonly game: FoundryGameLike,
    private readonly adapter: Dnd5eAdapter,
    private readonly authorization: AuthorizationService,
    private readonly chatRateLimiter: ChatRateLimiter,
  ) {}

  async execute(session: CompanionUserSession, input: unknown): Promise<CommandAck | ErrorResponse> {
    const parsed = CompanionCommandSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, code: 'VALIDATION_ERROR', message: 'Invalid command payload.', details: parsed.error.flatten() };
    }

    const command = parsed.data;
    const actor = this.resolveAuthorizedActor(session, command);
    if ('error' in actor) return actor.error;

    switch (command.command) {
      case 'updateHP':
        return this.updateHp(actor.actor, command);
      case 'spendResource':
        return this.spendResource(actor.actor, command);
      case 'useItem':
        return this.useItem(actor.actor, command);
      case 'castSpell':
        return this.castSpell(actor.actor, command);
      case 'sendChatMessage':
        return this.sendChatMessage(session, actor.actor, command);
      default:
        return { ok: false, code: 'COMMAND_FAILED', message: 'Unsupported command.' };
    }
  }

  private resolveAuthorizedActor(session: CompanionUserSession, command: CompanionCommand): { actor: FoundryActorLike } | { error: ErrorResponse } {
    const actorId = this.resolveActorId(session, command.actorHintId);
    const actor = actorId ? this.game.actors.get(actorId) : undefined;
    const access = this.authorization.ensureActorAccess(session, actor);
    if (!access.ok) return { error: access.error };
    return { actor: actor as FoundryActorLike };
  }

  private resolveActorId(session: CompanionUserSession, actorHintId?: string): string | undefined {
    if (actorHintId && session.actorIds.includes(actorHintId)) return actorHintId;
    return session.actorIds[0];
  }

  private async updateHp(actor: FoundryActorLike, command: z.infer<typeof UpdateHPCommandSchema>): Promise<CommandAck> {
    const hp = actor.system?.attributes?.hp ?? {};
    const nextValue = Math.min(Math.max((hp.value ?? 0) + command.payload.delta, 0), hp.max ?? 999);
    const nextTemp = Math.max((hp.temp ?? 0) + (command.payload.tempDelta ?? 0), 0);

    await actor.update({ 'system.attributes.hp.value': nextValue, 'system.attributes.hp.temp': nextTemp });

    return CommandAckSchema.parse({
      ok: true,
      command: command.command,
      actorId: actor.id,
      correlationId: command.requestId,
      resultingState: this.adapter.toActorSummary(actor),
    });
  }

  private async spendResource(actor: FoundryActorLike, command: z.infer<typeof SpendResourceCommandSchema>): Promise<CommandAck | ErrorResponse> {
    const resource = actor.system?.resources?.[command.payload.resourceId];
    if (!resource || typeof resource.value !== 'number') {
      return { ok: false, code: 'NOT_FOUND', message: 'Resource not found.' };
    }
    if (resource.value < command.payload.amount) {
      return { ok: false, code: 'COMMAND_FAILED', message: 'Insufficient resource value.' };
    }

    const next = resource.value - command.payload.amount;
    await actor.update({ [`system.resources.${command.payload.resourceId}.value`]: next });

    return { ok: true, command: command.command, actorId: actor.id, correlationId: command.requestId };
  }

  private async useItem(actor: FoundryActorLike, command: z.infer<typeof UseItemCommandSchema>): Promise<CommandAck | ErrorResponse> {
    const item = actor.items.find((candidate) => candidate.id === command.payload.itemId);
    if (!item) return { ok: false, code: 'NOT_FOUND', message: 'Item not found on actor.' };

    const usesValue = item.system?.uses?.value;
    if (typeof usesValue === 'number') {
      if (usesValue < command.payload.consumeQuantity) {
        return { ok: false, code: 'COMMAND_FAILED', message: 'Not enough charges.' };
      }
      await item.update({ 'system.uses.value': usesValue - command.payload.consumeQuantity });
    } else {
      const quantity = typeof item.system?.quantity === 'number' ? item.system.quantity : 1;
      if (quantity < command.payload.consumeQuantity) {
        return { ok: false, code: 'COMMAND_FAILED', message: 'Not enough quantity.' };
      }
      await item.update({ 'system.quantity': quantity - command.payload.consumeQuantity });
    }

    if (typeof item.use === 'function') {
      await item.use();
    }

    return { ok: true, command: command.command, actorId: actor.id, correlationId: command.requestId };
  }

  private async castSpell(actor: FoundryActorLike, command: z.infer<typeof CastSpellCommandSchema>): Promise<CommandAck | ErrorResponse> {
    const spell = actor.items.find((candidate) => candidate.id === command.payload.spellItemId && candidate.type === 'spell');
    if (!spell) return { ok: false, code: 'NOT_FOUND', message: 'Spell not found on actor.' };

    const level = command.payload.slotLevel ?? spell.system?.level ?? 0;
    if (level > 0) {
      const slotPath = `spell${level}`;
      const slots = actor.system?.spells?.[slotPath];
      if (!slots || typeof slots.value !== 'number' || slots.value <= 0) {
        return { ok: false, code: 'COMMAND_FAILED', message: 'No spell slots available.' };
      }
      await actor.update({ [`system.spells.${slotPath}.value`]: slots.value - 1 });
    }

    if (typeof spell.use === 'function') {
      await spell.use({ consumeSpellSlot: false });
    }

    return { ok: true, command: command.command, actorId: actor.id, correlationId: command.requestId };
  }

  private async sendChatMessage(
    session: CompanionUserSession,
    actor: FoundryActorLike,
    command: z.infer<typeof SendChatMessageCommandSchema>,
  ): Promise<CommandAck | ErrorResponse> {
    if (!this.chatRateLimiter.allow(session.sessionId)) {
      return { ok: false, code: 'RATE_LIMITED', message: 'Too many chat messages sent, slow down.' };
    }

    const content = command.payload.content.trim();
    const ChatMessage = (globalThis as any).ChatMessage;
    if (!ChatMessage?.create) {
      return { ok: false, code: 'COMMAND_FAILED', message: 'Chat subsystem unavailable.' };
    }

    await ChatMessage.create({
      user: session.foundryUserId,
      speaker: command.payload.inCharacter ? { actor: actor.id } : {},
      content,
    });

    return { ok: true, command: command.command, actorId: actor.id, correlationId: command.requestId };
  }
}
