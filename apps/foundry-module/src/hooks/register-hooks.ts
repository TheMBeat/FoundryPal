import type { BridgeService } from '../services/bridge-service.js';

export function registerHooks(bridge: BridgeService): void {
  const HooksApi = (globalThis as any).Hooks;
  if (!HooksApi?.on) return;

  HooksApi.on('updateActor', async (actor: { id: string }) => {
    await bridge.publishActorUpdate(actor.id);
  });

  HooksApi.on('createChatMessage', async (message: { id: string }) => {
    await bridge.publishChatMessage(message.id);
  });
}
