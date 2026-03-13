import { EventPayloadSchema, SessionPayloadSchema, SnapshotPayloadSchema } from '@foundrypal/shared';
import type { BridgeEnvelope, CompanionCommand } from '@foundrypal/shared';
import type { CompanionState, ConnectionState } from './types.js';

export const createInitialState = (): CompanionState => ({
  connection: 'idle',
  actorDetails: {},
  chats: [],
  pendingChatRequestIds: [],
});

export const setConnection = (state: CompanionState, connection: ConnectionState): CompanionState => ({ ...state, connection });

export const reduceEnvelope = (state: CompanionState, envelope: BridgeEnvelope): CompanionState => {
  if (envelope.type === 'session') {
    const session = SessionPayloadSchema.parse(envelope.payload);
    return {
      ...state,
      session,
      selectedActorId: state.selectedActorId ?? session.actorIds[0],
      lastError: undefined,
    };
  }

  if (envelope.type === 'snapshot') {
    const snapshot = SnapshotPayloadSchema.parse(envelope.payload);
    return {
      ...state,
      snapshot,
      chats: snapshot.chats,
      selectedActorId: state.selectedActorId ?? snapshot.actors[0]?.actorId,
      lastError: undefined,
    };
  }

  if (envelope.type === 'event') {
    const event = EventPayloadSchema.parse(envelope.payload);
    if (event.eventType === 'actorUpdated') {
      return {
        ...state,
        actorDetails: { ...state.actorDetails, [event.actor.actorId]: event.actor },
      };
    }

    return { ...state, chats: [...state.chats, event.chat] };
  }

  if (envelope.type === 'error') {
    const error = envelope.payload as { message?: string };
    return { ...state, lastError: error.message ?? 'Bridge error.' };
  }

  if (envelope.type === 'commandResult') {
    return {
      ...state,
      pendingChatRequestIds: envelope.correlationId
        ? state.pendingChatRequestIds.filter((id) => id !== envelope.correlationId)
        : state.pendingChatRequestIds,
    };
  }

  return state;
};

export const registerPendingCommand = (state: CompanionState, command: CompanionCommand): CompanionState => {
  if (command.command !== 'sendChatMessage') return state;
  return { ...state, pendingChatRequestIds: [...state.pendingChatRequestIds, command.requestId] };
};
