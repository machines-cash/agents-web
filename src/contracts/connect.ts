export const MACHINES_CONNECT_EVENT_TYPE = "machines.connect.popup";

export function createMachinesConnectState() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `connect_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export type MachinesConnectAuthorizeRequest = {
  clientId: string;
  redirectUri: string;
  scope?: string[];
  state?: string | null;
  codeChallenge: string;
  codeChallengeMethod?: "S256";
  origin?: string | null;
};

export type MachinesConnectAuthorizeRequestResponse = {
  requestId: string;
  clientId: string;
  expiresAt: string;
};

export type MachinesConnectRequestStatus = "pending" | "approved" | "declined" | "expired";

export type MachinesConnectAuthorizeRequestView = {
  requestId: string;
  clientId: string;
  clientName: string;
  redirectUri: string;
  origin: string;
  scope: string[];
  state: string | null;
  status: MachinesConnectRequestStatus;
  expiresAt: string;
};

export type MachinesConnectDecisionRequest = {
  decision: "authorize" | "decline";
};

export type MachinesConnectDecisionResponse =
  | {
      requestId: string;
      status: "approved";
      code: string;
      state: string | null;
      redirectUri: string;
    }
  | {
      requestId: string;
      status: "declined";
      state: string | null;
      redirectUri: string;
    };

export type MachinesConnectTokenRequest = {
  grantType: "authorization_code";
  clientId: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
};

export type MachinesConnectRefreshRequest = {
  clientId: string;
  refreshToken: string;
};

export type MachinesConnectRevokeRequest = {
  clientId: string;
  refreshToken: string;
};

export type MachinesConnectPopupSuccessMessage = {
  type: "success";
  requestId: string;
  state: string | null;
  code: string;
};

export type MachinesConnectPopupDeclinedMessage = {
  type: "declined";
  requestId: string;
  state: string | null;
};

export type MachinesConnectPopupErrorCode =
  | "invalid_request"
  | "invalid_target_origin"
  | "request_not_found"
  | "request_expired"
  | "not_authenticated"
  | "decision_failed"
  | "network_error";

export type MachinesConnectPopupErrorMessage = {
  type: "error";
  requestId: string | null;
  state: string | null;
  code: MachinesConnectPopupErrorCode;
  message: string;
};

export type MachinesConnectPopupMessage =
  | MachinesConnectPopupSuccessMessage
  | MachinesConnectPopupDeclinedMessage
  | MachinesConnectPopupErrorMessage;

export type MachinesConnectPopupEnvelope = {
  eventType: typeof MACHINES_CONNECT_EVENT_TYPE;
  payload: MachinesConnectPopupMessage;
};

export function isMachinesConnectPopupEnvelope(value: unknown): value is MachinesConnectPopupEnvelope {
  if (!value || typeof value !== "object") {
    return false;
  }
  const envelope = value as Partial<MachinesConnectPopupEnvelope>;
  if (envelope.eventType !== MACHINES_CONNECT_EVENT_TYPE) {
    return false;
  }
  const payload = envelope.payload as MachinesConnectPopupMessage | undefined;
  if (!payload || typeof payload !== "object") {
    return false;
  }
  return payload.type === "success" || payload.type === "declined" || payload.type === "error";
}
