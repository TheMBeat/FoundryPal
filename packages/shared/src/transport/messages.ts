import { z } from 'zod';
import { CompanionCommandSchema } from '../commands/contracts.js';
import {
  CommandAckSchema,
  CompanionActorDetailSchema,
  CompanionActorSummarySchema,
  CompanionChatMessageSchema,
  CompanionUserSessionSchema,
  ErrorResponseSchema,
} from '../schemas/dtos.js';

export const BridgeEnvelopeSchema = z.object({
  type: z.enum(['session', 'snapshot', 'event', 'command', 'commandResult', 'error']),
  timestamp: z.string().datetime(),
  correlationId: z.string().optional(),
  payload: z.unknown(),
});

export const SessionPayloadSchema = CompanionUserSessionSchema;
export const SnapshotPayloadSchema = z.object({
  actors: z.array(CompanionActorSummarySchema),
  chats: z.array(CompanionChatMessageSchema),
});

export const EventPayloadSchema = z.discriminatedUnion('eventType', [
  z.object({ eventType: z.literal('actorUpdated'), actor: CompanionActorDetailSchema }),
  z.object({ eventType: z.literal('chatCreated'), chat: CompanionChatMessageSchema }),
]);

export const CommandPayloadSchema = CompanionCommandSchema;
export const CommandResultPayloadSchema = z.union([CommandAckSchema, ErrorResponseSchema]);

export type BridgeEnvelope = z.infer<typeof BridgeEnvelopeSchema>;
export type TransportMessageHandler = (message: BridgeEnvelope) => Promise<void> | void;

export interface BridgeTransport {
  publish(message: BridgeEnvelope): Promise<void>;
  subscribe(handler: TransportMessageHandler): () => void;
}
