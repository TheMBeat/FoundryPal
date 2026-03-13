import { bootstrapModule } from './bootstrap/module.js';

declare const game: any;
declare const Hooks: any;

Hooks.once('init', () => {
  console.log('foundrypal-bridge init');
});

Hooks.once('ready', () => {
  const bridge = bootstrapModule(game);
  (globalThis as any).FoundryPalBridge = bridge;
});

export * from './services/bridge-service.js';
export * from './commands/handlers.js';
export * from './adapters/dnd5e-adapter.js';
