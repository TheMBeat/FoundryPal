import type { BridgeEnvelope } from '@foundrypal/shared';

export interface CompanionClientTransport {
  connect(): Promise<void>;
  onMessage(cb: (message: BridgeEnvelope) => void): () => void;
}

export class StubCompanionClientTransport implements CompanionClientTransport {
  async connect(): Promise<void> {
    return;
  }

  onMessage(): () => void {
    return () => undefined;
  }
}
