import type { AgentSession } from "./agent-api-contracts.js";

export const WEB_SESSION_STORAGE_KEY = "machines.cash.session";
export const AGENT_SESSION_STORAGE_KEY = "machines.cash.agent.session";

function isBrowser() {
  return typeof window !== "undefined";
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function decodeJwtPayload(token: string): { exp?: number } | null {
  const segments = token.split(".");
  if (segments.length !== 3) {
    return null;
  }
  const payload = segments[1];
  if (!payload) {
    return null;
  }
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const padded = padding ? normalized + "=".repeat(4 - padding) : normalized;

  try {
    if (typeof globalThis.atob === "function") {
      return JSON.parse(globalThis.atob(padded)) as { exp?: number };
    }
    const maybeBuffer = (
      globalThis as unknown as { Buffer?: { from: (value: string, encoding: string) => { toString: (encoding: string) => string } } }
    ).Buffer;
    if (maybeBuffer) {
      return JSON.parse(maybeBuffer.from(padded, "base64").toString("utf8")) as { exp?: number };
    }
  } catch {
    return null;
  }

  return null;
}

export function isAgentSessionExpired(session: AgentSession) {
  const fromField = Date.parse(session.expiresAt);
  if (!Number.isNaN(fromField)) {
    return fromField <= Date.now();
  }
  const payload = decodeJwtPayload(session.agentSessionToken);
  if (!payload?.exp) {
    return true;
  }
  return payload.exp * 1000 <= Date.now();
}

export function isAgentSessionNearExpiry(session: AgentSession, thresholdMs: number) {
  const expiryAtMs = Date.parse(session.expiresAt);
  if (!Number.isNaN(expiryAtMs)) {
    return expiryAtMs - Date.now() <= thresholdMs;
  }
  const payload = decodeJwtPayload(session.agentSessionToken);
  if (!payload?.exp) {
    return true;
  }
  return payload.exp * 1000 - Date.now() <= thresholdMs;
}

export function readWebSessionToken(): string | null {
  if (!isBrowser()) {
    return null;
  }
  return window.localStorage.getItem(WEB_SESSION_STORAGE_KEY);
}

export function writeWebSessionToken(token: string) {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(WEB_SESSION_STORAGE_KEY, token);
}

export function clearWebSessionToken() {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.removeItem(WEB_SESSION_STORAGE_KEY);
}

export function readAgentSession(): AgentSession | null {
  if (!isBrowser()) {
    return null;
  }
  const session = parseJson<AgentSession>(
    window.localStorage.getItem(AGENT_SESSION_STORAGE_KEY),
  );
  if (!session) {
    return null;
  }
  if (isAgentSessionExpired(session)) {
    clearAgentSession();
    return null;
  }
  return session;
}

export function readStoredAgentSession(): AgentSession | null {
  if (!isBrowser()) {
    return null;
  }
  return parseJson<AgentSession>(
    window.localStorage.getItem(AGENT_SESSION_STORAGE_KEY),
  );
}

export function writeAgentSession(session: AgentSession) {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(AGENT_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearAgentSession() {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.removeItem(AGENT_SESSION_STORAGE_KEY);
}
