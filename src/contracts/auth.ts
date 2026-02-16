export type SessionValidationStatus = "valid" | "invalid" | "expired";

export type WalletConnectorType =
  | "injected"
  | "walletconnect"
  | "coinbase"
  | "bankr"
  | "unknown";

export interface VerifiedSession {
  sessionId: string;
  address: string;
  userId: string | null;
  connector: WalletConnectorType;
  chainId: string | null;
  walletLabel: string | null;
  expiresAt: string | null;
  status: SessionValidationStatus;
}

export interface VerifySessionResponse {
  session: VerifiedSession;
}

export type SessionChallengeSiweFields = {
  domain: string;
  statement: string;
  uri: string;
  version: string;
  chainId: string | null;
  issuedAt: string;
  expirationTime: string;
  notBefore?: string | null;
  resources?: string[];
  type?: string | null;
  requestId?: string | null;
};

export interface SessionChallengeResponse {
  nonce: string;
  message: string;
  expiresAt: string;
  challengeToken?: string;
  siwe?: SessionChallengeSiweFields;
}

export interface SessionLoginResponse {
  token: string;
  session: VerifiedSession;
}
