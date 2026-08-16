export interface Connection {
  baseUrl: string;
  username: string;
  password: string;
}

export interface Session {
  id: string;
  title: string;
  time: {
    created: number;
    updated: number;
  };
  model?: {
    id: string;
    providerID: string;
  };
}

export interface TextPart {
  id: string;
  type: "text";
  text: string;
}

export interface StepStartPart {
  id: string;
  type: "step-start";
}

export interface StepFinishPart {
  id: string;
  type: "step-finish";
}

export interface PartMeta {
  id: string;
  messageID: string;
  type: string;
  text?: string;
}

export interface Message {
  info: {
    id: string;
    role: "user" | "assistant";
    modelID?: string;
    time?: { created: number };
  };
  parts: (TextPart | StepStartPart | StepFinishPart)[];
}

export interface StreamEvent {
  id: string;
  type: string;
  properties: Record<string, unknown>;
}

export interface MessagePartDelta extends StreamEvent {
  type: "message.part.delta";
  properties: {
    sessionID: string;
    messageID: string;
    partID: string;
    field: string;
    delta: string;
  };
}

export interface MessagePartUpdated extends StreamEvent {
  type: "message.part.updated";
  properties: {
    sessionID: string;
    part: PartMeta;
  };
}

export interface SessionIdle extends StreamEvent {
  type: "session.idle";
  properties: {
    sessionID: string;
  };
}