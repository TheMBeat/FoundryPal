import { z } from 'zod';

export const CompanionUserSessionSchema = z.object({
  sessionId: z.string().min(1),
  foundryUserId: z.string().min(1),
  username: z.string().min(1),
  role: z.enum(['PLAYER', 'TRUSTED', 'ASSISTANT', 'GAMEMASTER']),
  actorIds: z.array(z.string().min(1)),
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

export const CompanionResourceSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.number(),
  max: z.number().nullable(),
  kind: z.enum(['resource', 'spellSlot', 'charge']),
});

export const CompanionActionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['weapon', 'spell', 'feature', 'other']),
  activation: z.string().nullable(),
  available: z.boolean(),
});

export const CompanionItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  quantity: z.number(),
  equipped: z.boolean().nullable(),
  charges: z.object({ value: z.number(), max: z.number().nullable() }).nullable(),
});

export const CompanionSpellSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number().int().min(0).max(9),
  school: z.string().nullable(),
  prepared: z.boolean().nullable(),
  atWill: z.boolean(),
  ritual: z.boolean(),
  concentration: z.boolean(),
  uses: z.object({ value: z.number(), max: z.number().nullable() }).nullable(),
});

export const CompanionActorSummarySchema = z.object({
  actorId: z.string().min(1),
  name: z.string(),
  img: z.string().nullable(),
  hp: z.object({ value: z.number(), max: z.number(), temp: z.number() }),
  ac: z.number().nullable(),
  speed: z.number().nullable(),
  passives: z.object({ perception: z.number().nullable(), insight: z.number().nullable(), investigation: z.number().nullable() }),
});

export const CompanionActorDetailSchema = CompanionActorSummarySchema.extend({
  resources: z.array(CompanionResourceSchema),
  inventory: z.array(CompanionItemSchema),
  spells: z.array(CompanionSpellSchema),
  actions: z.array(CompanionActionSchema),
});

export const CompanionChatMessageSchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime(),
  authorUserId: z.string().nullable(),
  authorName: z.string(),
  actorId: z.string().nullable(),
  content: z.string(),
  whisperTo: z.array(z.string()),
});

export const ErrorResponseSchema = z.object({
  ok: z.literal(false),
  code: z.enum(['VALIDATION_ERROR', 'AUTH_ERROR', 'NOT_FOUND', 'RATE_LIMITED', 'COMMAND_FAILED']),
  message: z.string(),
  details: z.unknown().optional(),
  correlationId: z.string().optional(),
});

export const CommandAckSchema = z.object({
  ok: z.literal(true),
  command: z.string(),
  actorId: z.string().optional(),
  correlationId: z.string().optional(),
  resultingState: z.unknown().optional(),
});

export type CompanionUserSession = z.infer<typeof CompanionUserSessionSchema>;
export type CompanionActorSummary = z.infer<typeof CompanionActorSummarySchema>;
export type CompanionActorDetail = z.infer<typeof CompanionActorDetailSchema>;
export type CompanionResource = z.infer<typeof CompanionResourceSchema>;
export type CompanionItem = z.infer<typeof CompanionItemSchema>;
export type CompanionSpell = z.infer<typeof CompanionSpellSchema>;
export type CompanionAction = z.infer<typeof CompanionActionSchema>;
export type CompanionChatMessage = z.infer<typeof CompanionChatMessageSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type CommandAck = z.infer<typeof CommandAckSchema>;
