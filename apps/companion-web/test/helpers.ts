import type { BridgeEnvelope, BridgeTransport, TransportMessageHandler } from '@foundrypal/shared';

export class FakeTransport implements BridgeTransport {
  public published: BridgeEnvelope[] = [];
  private handlers = new Set<TransportMessageHandler>();

  async publish(message: BridgeEnvelope): Promise<void> {
    this.published.push(message);
  }

  subscribe(handler: TransportMessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  emit(message: BridgeEnvelope): void {
    this.handlers.forEach((handler) => handler(message));
  }
}

export const nowIso = () => new Date().toISOString();
