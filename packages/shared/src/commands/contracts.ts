import { z } from 'zod';

const BaseCommandSchema = z.object({
  requestId: z.string().min(1),
  actorHintId: z.string().optional(),
});

export const UpdateHPCommandSchema = BaseCommandSchema.extend({
  command: z.literal('updateHP'),
  payload: z.object({
    delta: z.number().int(),
    tempDelta: z.number().int().optional(),
  }),
});

export const SpendResourceCommandSchema = BaseCommandSchema.extend({
  command: z.literal('spendResource'),
  payload: z.object({
    resourceId: z.string().min(1),
    amount: z.number().int().positive(),
  }),
});

export const UseItemCommandSchema = BaseCommandSchema.extend({
  command: z.literal('useItem'),
  payload: z.object({
    itemId: z.string().min(1),
    consumeQuantity: z.number().int().positive().default(1),
  }),
});

export const CastSpellCommandSchema = BaseCommandSchema.extend({
  command: z.literal('castSpell'),
  payload: z.object({
    spellItemId: z.string().min(1),
    slotLevel: z.number().int().min(0).max(9).optional(),
  }),
});

export const SendChatMessageCommandSchema = BaseCommandSchema.extend({
  command: z.literal('sendChatMessage'),
  payload: z.object({
    content: z.string().min(1).max(2000),
    inCharacter: z.boolean().default(true),
  }),
});

export const CompanionCommandSchema = z.discriminatedUnion('command', [
  UpdateHPCommandSchema,
  SpendResourceCommandSchema,
  UseItemCommandSchema,
  CastSpellCommandSchema,
  SendChatMessageCommandSchema,
]);

export type UpdateHPCommand = z.infer<typeof UpdateHPCommandSchema>;
export type SpendResourceCommand = z.infer<typeof SpendResourceCommandSchema>;
export type UseItemCommand = z.infer<typeof UseItemCommandSchema>;
export type CastSpellCommand = z.infer<typeof CastSpellCommandSchema>;
export type SendChatMessageCommand = z.infer<typeof SendChatMessageCommandSchema>;
export type CompanionCommand = z.infer<typeof CompanionCommandSchema>;
