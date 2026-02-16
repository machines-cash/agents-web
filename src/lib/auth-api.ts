import type {
  SessionChallengeResponse,
  SessionLoginResponse,
  VerifySessionResponse,
  WalletConnectorType,
} from "@/contracts";
import { requestJson } from "./api-base";

export type ChallengeRequest = {
  address: string;
  connector?: WalletConnectorType;
  walletLabel?: string | null;
  chainId?: string | null;
};

export type LoginRequest = ChallengeRequest & {
  signature: string;
  nonce: string;
  challengeToken?: string | null;
};

export async function requestChallenge(payload: ChallengeRequest) {
  return requestJson<SessionChallengeResponse>({
    path: "/auth/challenge",
    method: "POST",
    body: payload,
  });
}

export async function createSession(payload: LoginRequest) {
  return requestJson<SessionLoginResponse>({
    path: "/auth/login",
    method: "POST",
    body: payload,
  });
}

export async function verifySession(accessToken: string) {
  return requestJson<VerifySessionResponse>({
    path: "/auth/session",
    method: "POST",
    body: { accessToken },
  });
}
