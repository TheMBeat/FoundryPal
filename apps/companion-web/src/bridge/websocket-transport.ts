import { BridgeEnvelopeSchema, type BridgeEnvelope, type BridgeTransport, type TransportMessageHandler } from '@foundrypal/shared';

export class BrowserWebSocketTransport implements BridgeTransport {
  private socket?: WebSocket;
  private handlers = new Set<TransportMessageHandler>();

  constructor(private readonly url: string) {
    this.open();
  }

  async publish(message: BridgeEnvelope): Promise<void> {
    const payload = BridgeEnvelopeSchema.parse(message);
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('Bridge socket is not connected');
    }
    this.socket.send(JSON.stringify(payload));
  }

  subscribe(handler: TransportMessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private open(): void {
    this.socket = new WebSocket(this.url);
    this.socket.addEventListener('message', (event) => {
      const parsed = BridgeEnvelopeSchema.parse(JSON.parse(event.data as string));
      this.handlers.forEach((handler) => handler(parsed));
    });
  }
}
