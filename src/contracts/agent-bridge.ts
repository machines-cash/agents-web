import type { AgentBridgeMessage } from "./agent-api-contracts.js";

export const AGENT_BRIDGE_EVENT_TYPE = "machines.agent.bridge";

export type AgentBridgeEnvelope = {
  eventType: typeof AGENT_BRIDGE_EVENT_TYPE;
  payload: AgentBridgeMessage;
};

export function createBridgeState() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `bridge_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function buildAgentBridgeUrl(options: {
  appOrigin: string;
  targetOrigin: string;
  state: string;
  apiBaseUrl: string;
}) {
  const url = new URL("/agent-auth-bridge.html", options.appOrigin);
  url.searchParams.set("targetOrigin", options.targetOrigin);
  url.searchParams.set("state", options.state);
  url.searchParams.set("apiBaseUrl", options.apiBaseUrl);
  return url.toString();
}

export function isAgentBridgeEnvelope(value: unknown): value is AgentBridgeEnvelope {
  if (!value || typeof value !== "object") {
    return false;
  }
  const envelope = value as Partial<AgentBridgeEnvelope>;
  if (envelope.eventType !== AGENT_BRIDGE_EVENT_TYPE) {
    return false;
  }
  const payload = envelope.payload as AgentBridgeMessage | undefined;
  if (!payload || typeof payload !== "object") {
    return false;
  }
  return payload.type === "success" || payload.type === "error";
}
