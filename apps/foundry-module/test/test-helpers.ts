import type { FoundryActorLike, FoundryGameLike, FoundryItemLike } from '../src/types/foundry.js';

export function makeItem(overrides: Partial<FoundryItemLike> = {}): FoundryItemLike {
  return {
    id: 'item-1',
    name: 'Longsword',
    type: 'weapon',
    system: { quantity: 1, equipped: true, uses: { value: 3, max: 3 } },
    async update(data) {
      Object.assign(this.system, patchToNested(data));
      return this;
    },
    async use() {
      return;
    },
    ...overrides,
  };
}

export function makeActor(overrides: Partial<FoundryActorLike> = {}): FoundryActorLike {
  const items = overrides.items ?? [makeItem()];
  return {
    id: 'actor-1',
    name: 'Hero',
    type: 'character',
    system: {
      attributes: { hp: { value: 20, max: 30, temp: 0 }, ac: { value: 16 }, movement: { walk: 30 } },
      resources: { primary: { label: 'Primary', value: 3, max: 3 } },
      skills: { prc: { passive: 12 }, ins: { passive: 11 }, inv: { passive: 10 } },
      spells: { spell1: { value: 2, max: 4 } },
    },
    items,
    ownership: { user1: 3 },
    async update(data) {
      Object.assign(this.system, patchToNested(data).system ?? {});
      return this;
    },
    ...overrides,
  };
}

export function makeGame(actor = makeActor()): FoundryGameLike {
  return {
    user: { id: 'user1', name: 'Alice', role: 1 },
    users: new Map([
      ['user1', { id: 'user1', name: 'Alice', role: 1 }],
      ['user2', { id: 'user2', name: 'Bob', role: 1 }],
    ]),
    actors: new Map([[actor.id, actor]]),
    messages: { contents: [] },
  };
}

function patchToNested(patch: Record<string, unknown>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [path, value] of Object.entries(patch)) {
    const keys = path.split('.');
    let cursor = result;
    for (let i = 0; i < keys.length - 1; i += 1) {
      const key = keys[i];
      cursor[key] = cursor[key] ?? {};
      cursor = cursor[key];
    }
    cursor[keys.at(-1) as string] = value;
  }
  return result;
}
