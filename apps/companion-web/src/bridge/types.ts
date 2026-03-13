import type {
  BridgeEnvelope,
  BridgeTransport,
  CommandAck,
  CompanionActorDetail,
  CompanionActorSummary,
  CompanionChatMessage,
  CompanionCommand,
  CompanionUserSession,
  ErrorResponse,
} from '@foundrypal/shared';

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

export interface CompanionSnapshot {
  actors: CompanionActorSummary[];
  chats: CompanionChatMessage[];
}

export interface CompanionState {
  connection: ConnectionState;
  session?: CompanionUserSession;
  snapshot?: CompanionSnapshot;
  selectedActorId?: string;
  actorDetails: Record<string, CompanionActorDetail>;
  chats: CompanionChatMessage[];
  lastError?: string;
  pendingChatRequestIds: string[];
}

export interface BridgeClient {
  connect(): Promise<void>;
  disconnect(): void;
  sendCommand(command: CompanionCommand): Promise<void>;
  subscribe(cb: (state: CompanionState) => void): () => void;
}

export type TransportFactory = () => BridgeTransport;

export interface BridgeCommandResult {
  ack?: CommandAck;
  error?: ErrorResponse;
}

export type EnvelopeHandler = (envelope: BridgeEnvelope) => void;
