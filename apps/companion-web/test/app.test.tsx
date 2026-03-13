import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompanionApp } from '../src/App.js';
import { FakeTransport, nowIso } from './helpers.js';
import { groupInventory } from '../src/screens/InventoryScreen.js';
import { filterSpells } from '../src/screens/SpellsScreen.js';

describe('CompanionApp', () => {
  it('shows loading state before first payload', () => {
    const transport = new FakeTransport();
    render(<CompanionApp transport={transport} />);
    expect(screen.getByText('Connecting to bridge…')).toBeInTheDocument();
  });

  it('shows error state from bridge envelope', async () => {
    const transport = new FakeTransport();
    render(<CompanionApp transport={transport} />);

    transport.emit({ type: 'error', timestamp: nowIso(), payload: { ok: false, code: 'COMMAND_FAILED', message: 'boom' } });

    await waitFor(() => expect(screen.getByText(/Error: boom/)).toBeInTheDocument());
  });

  it('renders actor detail on my character screen', async () => {
    const transport = new FakeTransport();
    render(<CompanionApp transport={transport} />);

    transport.emit({ type: 'session', timestamp: nowIso(), payload: { sessionId: 's1', foundryUserId: 'u1', username: 'Player', role: 'PLAYER', actorIds: ['a1'], issuedAt: nowIso(), expiresAt: nowIso() } });
    transport.emit({ type: 'snapshot', timestamp: nowIso(), payload: { actors: [{ actorId: 'a1', name: 'Aerin', img: null, hp: { value: 10, max: 14, temp: 0 }, ac: 15, speed: 30, passives: { perception: 13, insight: 12, investigation: 11 } }], chats: [] } });
    transport.emit({ type: 'event', timestamp: nowIso(), payload: { eventType: 'actorUpdated', actor: { actorId: 'a1', name: 'Aerin', img: null, hp: { value: 10, max: 14, temp: 0 }, ac: 15, speed: 30, passives: { perception: 13, insight: 12, investigation: 11 }, resources: [], inventory: [], spells: [], actions: [] } } });

    await waitFor(() => expect(screen.getByText('Aerin')).toBeInTheDocument());
    expect(screen.getByText('HP 10/14')).toBeInTheDocument();
  });

  it('supports chat send flow', async () => {
    const user = userEvent.setup();
    const transport = new FakeTransport();
    render(<CompanionApp transport={transport} />);

    transport.emit({ type: 'session', timestamp: nowIso(), payload: { sessionId: 's1', foundryUserId: 'u1', username: 'Player', role: 'PLAYER', actorIds: ['a1'], issuedAt: nowIso(), expiresAt: nowIso() } });
    transport.emit({ type: 'snapshot', timestamp: nowIso(), payload: { actors: [{ actorId: 'a1', name: 'Aerin', img: null, hp: { value: 10, max: 14, temp: 0 }, ac: 15, speed: 30, passives: { perception: 13, insight: 12, investigation: 11 } }], chats: [] } });

    await user.click(screen.getByRole('button', { name: 'Chat' }));
    await user.type(screen.getByRole('textbox'), 'hello table');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(transport.published.at(-1)?.type).toBe('command');
    expect((transport.published.at(-1)?.payload as { command: string }).command).toBe('sendChatMessage');
  });

  it('shows reconnect state when transport drops', async () => {
    const transport = new FakeTransport();
    render(<CompanionApp transport={transport} />);
    transport.emit({ type: 'snapshot', timestamp: nowIso(), payload: { actors: [], chats: [] } });
    await waitFor(() => expect(screen.getByText('connected')).toBeInTheDocument());

    transport.emit({ type: 'error', timestamp: nowIso(), payload: { ok: false, code: 'COMMAND_FAILED', message: 'disconnected' } });
    await waitFor(() => expect(screen.getByText(/Error: disconnected/)).toBeInTheDocument());
  });
});

describe('utility behaviors', () => {
  it('groups inventory by category', () => {
    const grouped = groupInventory([
      { id: '1', name: 'Dagger', type: 'weapon', quantity: 1, equipped: true, charges: null },
      { id: '2', name: 'Torch', type: 'gear', quantity: 2, equipped: null, charges: null },
      { id: '3', name: 'Sword', type: 'weapon', quantity: 1, equipped: false, charges: null },
    ]);
    expect(grouped).toHaveLength(2);
    expect(grouped.find((g) => g.category === 'weapon')?.items).toHaveLength(2);
  });

  it('filters spells by level', () => {
    const spells = [
      { id: 's1', name: 'Shield', level: 1, school: null, prepared: true, atWill: false, ritual: false, concentration: false, uses: null },
      { id: 's2', name: 'Mage Hand', level: 0, school: null, prepared: null, atWill: true, ritual: false, concentration: false, uses: null },
    ];

    expect(filterSpells(spells, 1)).toHaveLength(1);
    expect(filterSpells(spells, 'all')).toHaveLength(2);
  });
});
