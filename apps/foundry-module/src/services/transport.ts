import type { BridgeEnvelope, BridgeTransport, TransportMessageHandler } from '@foundrypal/shared';

export class InMemoryBridgeTransport implements BridgeTransport {
  private handlers = new Set<TransportMessageHandler>();

  async publish(message: BridgeEnvelope): Promise<void> {
    await Promise.all(Array.from(this.handlers).map((handler) => Promise.resolve(handler(message))));
  }

  subscribe(handler: TransportMessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
}
