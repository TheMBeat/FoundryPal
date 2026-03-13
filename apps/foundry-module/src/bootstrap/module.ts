import { InMemoryBridgeTransport } from '../services/transport.js';
import { BridgeService } from '../services/bridge-service.js';
import { registerHooks } from '../hooks/register-hooks.js';
import type { FoundryGameLike } from '../types/foundry.js';

const MODULE_ID = 'foundrypal-bridge';

export function bootstrapModule(game: FoundryGameLike): BridgeService {
  const bridge = new BridgeService(game, new InMemoryBridgeTransport(), {
    sessionTtlMs: Number(process.env.FOUNDRYPAL_SESSION_TTL_MS ?? 12 * 60 * 60 * 1000),
  });

  registerHooks(bridge);

  const HooksApi = (globalThis as any).Hooks;
  HooksApi?.on?.('ready', () => {
    console.log(`${MODULE_ID} ready`);
  });

  return bridge;
}
