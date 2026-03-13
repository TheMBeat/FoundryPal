import { useEffect, useMemo, useState } from 'react';
import { MobileLayout, StatusBlock } from './components/Layout.js';
import { CompanionBridgeClient } from './bridge/client.js';
import type { BridgeTransport, CompanionCommand } from '@foundrypal/shared';
import { ActionsScreen } from './screens/ActionsScreen.js';
import { ChatScreen } from './screens/ChatScreen.js';
import { InventoryScreen } from './screens/InventoryScreen.js';
import { MyCharacterScreen } from './screens/MyCharacterScreen.js';
import { SpellsScreen } from './screens/SpellsScreen.js';
import type { CompanionState } from './bridge/types.js';

const TABS = [
  { key: 'character', label: 'My Character' },
  { key: 'actions', label: 'Actions' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'spells', label: 'Spells' },
  { key: 'chat', label: 'Chat' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function CompanionApp({ transport }: { transport: BridgeTransport }): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabKey>('character');
  const [viewState, setViewState] = useState<CompanionState>({ connection: 'idle', actorDetails: {}, chats: [], pendingChatRequestIds: [] });
  const client = useMemo(() => new CompanionBridgeClient(transport), [transport]);

  useEffect(() => {
    const unsub = client.subscribe(setViewState);
    void client.connect().catch(() => client.setConnectionState('error'));
    return () => {
      unsub();
      client.disconnect();
    };
  }, [client]);

  const actorId = viewState.selectedActorId;
  const actorDetail = actorId ? viewState.actorDetails[actorId] : undefined;
  const actorSummary = viewState.snapshot?.actors.find((actor) => actor.actorId === actorId);

  const sendCommand = (command: Omit<CompanionCommand, 'requestId'>): void => {
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    void client.sendCommand({ ...command, requestId });
  };

  const sharedStatus = viewState.connection === 'connecting'
    ? <StatusBlock text="Connecting to bridge…" />
    : viewState.connection === 'reconnecting'
      ? <StatusBlock text="Reconnecting…" />
      : viewState.lastError
        ? <StatusBlock text={`Error: ${viewState.lastError}`} />
        : undefined;

  const actorReady = Boolean(actorDetail);

  const content = activeTab === 'character' ? (
    <MyCharacterScreen
      actor={actorDetail}
      summary={actorSummary}
      onUpdateHp={(delta) => actorId && sendCommand({ command: 'updateHP', actorHintId: actorId, payload: { delta } })}
    />
  ) : activeTab === 'actions' ? (
    <ActionsScreen actions={actorDetail?.actions ?? []} actorReady={actorReady} />
  ) : activeTab === 'inventory' ? (
    <InventoryScreen
      items={actorDetail?.inventory ?? []}
      actorReady={actorReady}
      onUseItem={(itemId) => actorId && sendCommand({ command: 'useItem', actorHintId: actorId, payload: { itemId, consumeQuantity: 1 } })}
    />
  ) : activeTab === 'spells' ? (
    <SpellsScreen
      spells={actorDetail?.spells ?? []}
      actorReady={actorReady}
      onCast={(spellItemId, slotLevel) => actorId && sendCommand({ command: 'castSpell', actorHintId: actorId, payload: { spellItemId, slotLevel } })}
    />
  ) : (
    <ChatScreen
      chats={viewState.chats}
      pendingCount={viewState.pendingChatRequestIds.length}
      canSend={viewState.connection === 'connected' && Boolean(actorId)}
      onSend={(content) => actorId && sendCommand({ command: 'sendChatMessage', actorHintId: actorId, payload: { content, inCharacter: true } })}
    />
  );

  return (
    <MobileLayout
      title="FoundryPal"
      tabs={TABS as unknown as Array<{ key: string; label: string }>}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as TabKey)}
      connection={viewState.connection}
      content={<>{sharedStatus}{content}</>}
    />
  );
}
