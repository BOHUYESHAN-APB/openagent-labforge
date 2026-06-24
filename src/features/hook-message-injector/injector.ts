// Stub module — TODO: implement from upstream oh-my-openagent
// Source: Future/oh-my-openagent/.../hook-message-injector/injector.ts

export interface StoredMessage {
  id: string;
  sessionID: string;
  role: string;
  parts: Array<{ type: string; text?: string }>;
  info?: Record<string, unknown>;
}

export interface MessageMeta {
  agent?: string;
  model?: string;
  [key: string]: unknown;
}

export function findFirstMessageWithAgent(
  _messages: StoredMessage[],
  _agent: string,
): StoredMessage | undefined {
  return undefined;
}

export function findFirstMessageWithAgentFromSDK(
  _messages: Array<{ info?: { agent?: string } }>,
  _agent: string,
): unknown | undefined {
  return undefined;
}

export function findNearestMessageWithFields(
  _messages: StoredMessage[],
  _fields: Record<string, unknown>,
): StoredMessage | undefined {
  return undefined;
}

export function findNearestMessageWithFieldsFromSDK(
  _messages: Array<{ info?: Record<string, unknown> }>,
  _fields: Record<string, unknown>,
): unknown | undefined {
  return undefined;
}

export function injectHookMessage(
  _messages: StoredMessage[],
  _text: string,
  _meta?: MessageMeta,
): StoredMessage[] {
  return _messages;
}

export function resolveMessageContext(
  _messages: StoredMessage[],
  _sessionID: string,
): Record<string, unknown> {
  return {};
}
