import type {
  CompanionAction,
  CompanionActorDetail,
  CompanionActorSummary,
  CompanionChatMessage,
  CompanionItem,
  CompanionResource,
  CompanionSpell,
} from '@foundrypal/shared';
import type { FoundryActorLike, FoundryChatMessageLike, FoundryItemLike } from '../types/foundry.js';

const asNumber = (value: unknown, fallback = 0): number => (typeof value === 'number' ? value : fallback);

export class Dnd5eAdapter {
  toActorSummary(actor: FoundryActorLike): CompanionActorSummary {
    const attrs = actor.system?.attributes ?? {};
    return {
      actorId: actor.id,
      name: actor.name,
      img: actor.img ?? null,
      hp: {
        value: asNumber(attrs.hp?.value),
        max: asNumber(attrs.hp?.max),
        temp: asNumber(attrs.hp?.temp),
      },
      ac: typeof attrs.ac?.value === 'number' ? attrs.ac.value : null,
      speed: typeof attrs.movement?.walk === 'number' ? attrs.movement.walk : null,
      passives: {
        perception: actor.system?.skills?.prc?.passive ?? null,
        insight: actor.system?.skills?.ins?.passive ?? null,
        investigation: actor.system?.skills?.inv?.passive ?? null,
      },
    };
  }

  toResourceList(actor: FoundryActorLike): CompanionResource[] {
    const resources = actor.system?.resources ?? {};
    return Object.entries(resources).flatMap(([id, value]: [string, any]) => {
      if (!value || typeof value !== 'object') return [];
      if (typeof value.value !== 'number') return [];
      return [
        {
          id,
          label: value.label ?? id,
          value: value.value,
          max: typeof value.max === 'number' ? value.max : null,
          kind: 'resource' as const,
        },
      ];
    });
  }

  toCompanionItem(item: FoundryItemLike): CompanionItem {
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      quantity: typeof item.system?.quantity === 'number' ? item.system.quantity : 1,
      equipped: typeof item.system?.equipped === 'boolean' ? item.system.equipped : null,
      charges:
        typeof item.system?.uses?.value === 'number'
          ? {
              value: item.system.uses.value,
              max: typeof item.system.uses.max === 'number' ? item.system.uses.max : null,
            }
          : null,
    };
  }

  toCompanionSpell(item: FoundryItemLike): CompanionSpell {
    return {
      id: item.id,
      name: item.name,
      level: typeof item.system?.level === 'number' ? item.system.level : 0,
      school: item.system?.school ?? null,
      prepared: typeof item.system?.preparation?.prepared === 'boolean' ? item.system.preparation.prepared : null,
      atWill: item.system?.preparation?.mode === 'atwill',
      ritual: Boolean(item.system?.properties?.ritual),
      concentration: Boolean(item.system?.properties?.concentration),
      uses:
        typeof item.system?.uses?.value === 'number'
          ? {
              value: item.system.uses.value,
              max: typeof item.system.uses.max === 'number' ? item.system.uses.max : null,
            }
          : null,
    };
  }

  toCompanionAction(item: FoundryItemLike): CompanionAction {
    return {
      id: item.id,
      name: item.name,
      type: item.type === 'spell' ? 'spell' : item.type === 'weapon' ? 'weapon' : 'other',
      activation: item.system?.activation?.type ?? null,
      available: item.system?.equipped !== false,
    };
  }

  toActorDetail(actor: FoundryActorLike): CompanionActorDetail {
    const inventory = actor.items.filter((item) => ['weapon', 'equipment', 'consumable', 'tool', 'loot'].includes(item.type));
    const spells = actor.items.filter((item) => item.type === 'spell');
    const actionItems = actor.items.filter((item) => ['weapon', 'spell', 'feat'].includes(item.type));

    return {
      ...this.toActorSummary(actor),
      resources: this.toResourceList(actor),
      inventory: inventory.map((item) => this.toCompanionItem(item)),
      spells: spells.map((item) => this.toCompanionSpell(item)),
      actions: actionItems.map((item) => this.toCompanionAction(item)),
    };
  }

  toChatMessage(message: FoundryChatMessageLike, authorName: string): CompanionChatMessage {
    return {
      id: message.id,
      timestamp: new Date(message.timestamp).toISOString(),
      authorUserId: message.user?.id ?? null,
      authorName,
      actorId: message.speaker?.actor ?? null,
      content: message.content,
      whisperTo: message.whisper ?? [],
    };
  }
}
