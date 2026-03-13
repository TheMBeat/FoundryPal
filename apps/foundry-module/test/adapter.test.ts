import { describe, expect, it } from 'vitest';
import { Dnd5eAdapter } from '../src/adapters/dnd5e-adapter.js';
import { makeActor, makeItem } from './test-helpers.js';

describe('Dnd5eAdapter', () => {
  it('maps actor summary', () => {
    const adapter = new Dnd5eAdapter();
    const summary = adapter.toActorSummary(makeActor());
    expect(summary.hp.value).toBe(20);
    expect(summary.passives.perception).toBe(12);
  });

  it('maps actor detail with inventory and spells', () => {
    const adapter = new Dnd5eAdapter();
    const actor = makeActor({
      items: [
        makeItem(),
        makeItem({ id: 'spell-1', name: 'Magic Missile', type: 'spell', system: { level: 1, preparation: { mode: 'prepared', prepared: true } } }),
      ],
    });

    const detail = adapter.toActorDetail(actor);
    expect(detail.inventory.length).toBe(1);
    expect(detail.spells[0]?.name).toBe('Magic Missile');
  });
});
