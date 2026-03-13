export interface FoundryUserLike {
  id: string;
  name: string;
  role: number;
  character?: { id: string } | null;
  isGM?: boolean;
}

export interface FoundryActorLike {
  id: string;
  name: string;
  img?: string;
  type: string;
  ownership?: Record<string, number>;
  system: any;
  items: FoundryItemLike[];
  update(data: Record<string, unknown>): Promise<unknown>;
  rollAbilitySave?(ability: string): Promise<unknown>;
}

export interface FoundryItemLike {
  id: string;
  name: string;
  type: string;
  system: any;
  use?(options?: Record<string, unknown>): Promise<unknown>;
  update(data: Record<string, unknown>): Promise<unknown>;
}

export interface FoundryChatMessageLike {
  id: string;
  user?: { id: string } | null;
  speaker?: { actor?: string };
  timestamp: number;
  content: string;
  whisper?: string[];
}

export interface FoundryGameLike {
  user?: FoundryUserLike;
  users: Map<string, FoundryUserLike>;
  actors: Map<string, FoundryActorLike>;
  messages: { contents: FoundryChatMessageLike[] };
}
