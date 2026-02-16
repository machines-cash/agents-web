import type {
  AgentActionConfirmRequest,
  AgentActionConfirmResponse,
  AgentActionStatusResponse,
  AgentBankrConnectResponse,
  AgentBankrExportResponse,
  AgentChatMessageResponse,
  AgentChatMessageRequest,
  AgentChatSessionCreateResponse,
  AgentChatSessionDeleteResponse,
  AgentChatSessionListResponse,
  AgentChatSessionResponse,
  AgentChatSessionUpdateResponse,
  AgentKycAgreementsPayload,
  AgentKycApplicationPayload,
  AgentKycStatusResponse,
  AgentLogoutResponse,
  AgentSession,
  AgentSessionRefreshResponse,
  MachinesConnectAuthorizeRequest,
  MachinesConnectAuthorizeRequestResponse,
  MachinesConnectDecisionResponse,
  MachinesConnectRefreshRequest,
  MachinesConnectRevokeRequest,
  MachinesConnectTokenRequest,
} from "@/contracts";
import { requestJson } from "./api-base";

type InitExchangeResponse = {
  exchangeToken: string;
  expiresAt: string;
};

export type AgentCatalogImageResolveResult = {
  itemKey: string;
  imageUrl: string | null;
  source: "cache_memory" | "cache_redis" | "metadata" | "favicon" | "none";
};

export type AgentCatalogImageResolveResponse = {
  results: AgentCatalogImageResolveResult[];
};

export async function initAgentExchange(webSessionToken: string) {
  return requestJson<InitExchangeResponse>({
    path: "/agent/v1/auth/exchange/init",
    method: "POST",
    token: webSessionToken,
  });
}

export async function consumeAgentExchange(exchangeToken: string) {
  return requestJson<AgentSession>({
    path: "/agent/v1/auth/exchange/consume",
    method: "POST",
    body: { exchangeToken },
  });
}

export async function connectAgentWithBankr() {
  return requestJson<AgentBankrConnectResponse>({
    path: "/agent/v1/auth/bankr/connect",
    method: "POST",
  });
}

export async function exportAgentBankrWallet(agentSessionToken: string) {
  return requestJson<AgentBankrExportResponse>({
    path: "/agent/v1/auth/bankr/export",
    method: "POST",
    token: agentSessionToken,
  });
}

export async function refreshAgentSession(agentSessionToken: string) {
  return requestJson<AgentSessionRefreshResponse>({
    path: "/agent/v1/auth/session/refresh",
    method: "POST",
    token: agentSessionToken,
  });
}

export async function logoutAgentSession(agentSessionToken: string) {
  return requestJson<AgentLogoutResponse>({
    path: "/agent/v1/auth/logout",
    method: "POST",
    token: agentSessionToken,
  });
}

export async function createMachinesConnectAuthorizationRequest(
  payload: MachinesConnectAuthorizeRequest,
) {
  return requestJson<MachinesConnectAuthorizeRequestResponse>({
    path: "/connect/v1/authorize/requests",
    method: "POST",
    body: payload,
  });
}

export async function exchangeMachinesConnectAuthorizationCode(
  payload: MachinesConnectTokenRequest,
) {
  return requestJson<AgentSession>({
    path: "/connect/v1/token",
    method: "POST",
    body: payload,
  });
}

export async function refreshMachinesConnectSession(payload: MachinesConnectRefreshRequest) {
  return requestJson<AgentSession>({
    path: "/connect/v1/token/refresh",
    method: "POST",
    body: payload,
  });
}

export async function revokeMachinesConnectSession(payload: MachinesConnectRevokeRequest) {
  return requestJson<{ ok: boolean }>({
    path: "/connect/v1/token/revoke",
    method: "POST",
    body: payload,
  });
}

export async function decideMachinesConnectAuthorizationRequest(options: {
  requestId: string;
  decision: "authorize" | "decline";
  sessionToken: string;
}) {
  return requestJson<MachinesConnectDecisionResponse>({
    path: `/connect/v1/authorize/requests/${encodeURIComponent(options.requestId)}/decision`,
    method: "POST",
    body: { decision: options.decision },
    token: options.sessionToken,
  });
}

export async function getAgentKycStatus(agentSessionToken: string) {
  return requestJson<AgentKycStatusResponse>({
    path: "/agent/v1/kyc/status",
    method: "GET",
    token: agentSessionToken,
  });
}

export async function submitAgentKycApplication(
  agentSessionToken: string,
  payload: AgentKycApplicationPayload,
) {
  return requestJson<AgentKycStatusResponse>({
    path: "/agent/v1/kyc/application",
    method: "POST",
    token: agentSessionToken,
    body: payload,
  });
}

export async function acceptAgentKycAgreements(
  agentSessionToken: string,
  payload: AgentKycAgreementsPayload = { accepted: true },
) {
  return requestJson<AgentKycStatusResponse>({
    path: "/agent/v1/kyc/agreements",
    method: "POST",
    token: agentSessionToken,
    body: payload,
  });
}

export async function createAgentChatSession(options: {
  agentSessionToken: string;
  title?: string;
}) {
  return requestJson<AgentChatSessionCreateResponse>({
    path: "/agent/v1/chat/sessions",
    method: "POST",
    token: options.agentSessionToken,
    body: options.title ? { title: options.title } : {},
  });
}

export async function getAgentChatSession(options: {
  agentSessionToken: string;
  chatSessionId: string;
}) {
  return requestJson<AgentChatSessionResponse>({
    path: `/agent/v1/chat/sessions/${encodeURIComponent(options.chatSessionId)}`,
    method: "GET",
    token: options.agentSessionToken,
  });
}

export async function listAgentChatSessions(options: {
  agentSessionToken: string;
  limit?: number;
  cursor?: string;
  includeArchived?: boolean;
  includeEmpty?: boolean;
}) {
  const params = new URLSearchParams();
  if (typeof options.limit === "number") {
    params.set("limit", String(options.limit));
  }
  if (options.cursor) {
    params.set("cursor", options.cursor);
  }
  if (typeof options.includeArchived === "boolean") {
    params.set("includeArchived", options.includeArchived ? "true" : "false");
  }
  if (typeof options.includeEmpty === "boolean") {
    params.set("includeEmpty", options.includeEmpty ? "true" : "false");
  }
  const query = params.toString();

  return requestJson<AgentChatSessionListResponse>({
    path: `/agent/v1/chat/sessions${query ? `?${query}` : ""}`,
    method: "GET",
    token: options.agentSessionToken,
  });
}

export async function updateAgentChatSession(options: {
  agentSessionToken: string;
  chatSessionId: string;
  title?: string;
  archived?: boolean;
}) {
  return requestJson<AgentChatSessionUpdateResponse>({
    path: `/agent/v1/chat/sessions/${encodeURIComponent(options.chatSessionId)}`,
    method: "PATCH",
    token: options.agentSessionToken,
    body: {
      ...(typeof options.title === "string" ? { title: options.title } : {}),
      ...(typeof options.archived === "boolean"
        ? { archived: options.archived }
        : {}),
    },
  });
}

export async function deleteAgentChatSession(options: {
  agentSessionToken: string;
  chatSessionId: string;
}) {
  return requestJson<AgentChatSessionDeleteResponse>({
    path: `/agent/v1/chat/sessions/${encodeURIComponent(options.chatSessionId)}`,
    method: "DELETE",
    token: options.agentSessionToken,
  });
}

export async function sendAgentChatMessage(options: {
  agentSessionToken: string;
  chatSessionId: string;
  message: string;
  context?: AgentChatMessageRequest["context"];
  signal?: AbortSignal;
}) {
  return requestJson<AgentChatMessageResponse>({
    path: `/agent/v1/chat/sessions/${encodeURIComponent(options.chatSessionId)}/messages`,
    method: "POST",
    token: options.agentSessionToken,
    body: {
      message: options.message,
      ...(options.context ? { context: options.context } : {}),
    },
    signal: options.signal,
  });
}

export async function confirmAgentChatAction(options: {
  agentSessionToken: string;
  actionId: string;
  billingOverride?: AgentActionConfirmRequest["billingOverride"];
}) {
  const body: AgentActionConfirmRequest = {};
  if (options.billingOverride) {
    body.billingOverride = options.billingOverride;
  }
  return requestJson<AgentActionConfirmResponse>({
    path: `/agent/v1/chat/actions/${encodeURIComponent(options.actionId)}/confirm`,
    method: "POST",
    token: options.agentSessionToken,
    body,
  });
}

export async function getAgentChatActionStatus(options: {
  agentSessionToken: string;
  actionId: string;
}) {
  return requestJson<AgentActionStatusResponse>({
    path: `/agent/v1/chat/actions/${encodeURIComponent(options.actionId)}/status`,
    method: "GET",
    token: options.agentSessionToken,
  });
}

export async function submitAgentChatActionThreeDsCode(options: {
  agentSessionToken: string;
  actionId: string;
  code: string;
}) {
  return requestJson<AgentActionStatusResponse>({
    path: `/agent/v1/chat/actions/${encodeURIComponent(options.actionId)}/3ds-code`,
    method: "POST",
    token: options.agentSessionToken,
    body: {
      code: options.code,
    },
  });
}

export async function resolveAgentCatalogImages(options: {
  agentSessionToken: string;
  items: Array<{ itemKey: string; url: string }>;
}) {
  return requestJson<AgentCatalogImageResolveResponse>({
    path: "/agent/v1/catalog/images/resolve",
    method: "POST",
    token: options.agentSessionToken,
    body: {
      items: options.items,
    },
  });
}
