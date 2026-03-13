import { BridgeEnvelopeSchema, CompanionCommandSchema } from '@foundrypal/shared';
import type { BridgeClient, CompanionState } from './types.js';
import type { BridgeTransport, CompanionCommand } from '@foundrypal/shared';
import { createInitialState, reduceEnvelope, registerPendingCommand, setConnection } from './state.js';

export class CompanionBridgeClient implements BridgeClient {
  private readonly listeners = new Set<(state: CompanionState) => void>();
  private state = createInitialState();
  private unsubscribeTransport?: () => void;

  constructor(private readonly transport: BridgeTransport) {}

  async connect(): Promise<void> {
    this.state = setConnection(this.state, this.state.connection === 'connected' ? 'connected' : 'connecting');
    this.emit();

    this.unsubscribeTransport = this.transport.subscribe((message) => {
      const envelope = BridgeEnvelopeSchema.parse(message);
      this.state = reduceEnvelope(this.state, envelope);
      if (this.state.connection !== 'connected') {
        this.state = setConnection(this.state, 'connected');
      }
      this.emit();
    });
  }

  disconnect(): void {
    this.unsubscribeTransport?.();
    this.unsubscribeTransport = undefined;
    this.state = setConnection(this.state, 'disconnected');
    this.emit();
  }

  async sendCommand(command: CompanionCommand): Promise<void> {
    const parsed = CompanionCommandSchema.parse(command);
    this.state = registerPendingCommand(this.state, parsed);
    this.emit();

    await this.transport.publish({
      type: 'command',
      timestamp: new Date().toISOString(),
      correlationId: parsed.requestId,
      payload: parsed,
    });
  }

  subscribe(cb: (state: CompanionState) => void): () => void {
    this.listeners.add(cb);
    cb(this.state);
    return () => this.listeners.delete(cb);
  }

  setConnectionState(connection: CompanionState['connection']): void {
    this.state = setConnection(this.state, connection);
    this.emit();
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }
}
