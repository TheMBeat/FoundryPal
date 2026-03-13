import type { CompanionSpell } from '@foundrypal/shared';
import { useMemo, useState } from 'react';

export function filterSpells(spells: CompanionSpell[], level: number | 'all'): CompanionSpell[] {
  if (level === 'all') return spells;
  return spells.filter((spell) => spell.level === level);
}

export function SpellsScreen({
  spells,
  actorReady,
  onCast,
}: {
  spells: CompanionSpell[];
  actorReady: boolean;
  onCast: (spellItemId: string, slotLevel?: number) => void;
}): JSX.Element {
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all');
  const filtered = useMemo(() => filterSpells(spells, levelFilter), [spells, levelFilter]);

  if (!actorReady) return <p>Waiting for actor detail stream.</p>;

  return (
    <section>
      <label>
        Level
        <select value={String(levelFilter)} onChange={(event) => setLevelFilter(event.target.value === 'all' ? 'all' : Number(event.target.value))}>
          <option value="all">All</option>
          {Array.from({ length: 10 }, (_, level) => <option key={level} value={level}>{level}</option>)}
        </select>
      </label>
      <ul className="card-list">
        {filtered.map((spell) => (
          <li key={spell.id} className="card compact">
            <div>
              <strong>{spell.name}</strong>
              <p>L{spell.level} {spell.prepared === null ? '' : spell.prepared ? '• Prepared' : '• Not prepared'}</p>
            </div>
            <button onClick={() => onCast(spell.id, spell.level > 0 ? spell.level : undefined)}>Cast</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
