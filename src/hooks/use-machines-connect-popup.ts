"use client";

import {
  createMachinesConnectState,
  isMachinesConnectPopupEnvelope,
  type MachinesConnectAuthorizeRequest,
  type MachinesConnectPopupErrorMessage,
} from "@/contracts";
import { useCallback, useRef } from "react";
import { createMachinesConnectAuthorizationRequest } from "../lib/agent-api";
import { resolveAgentOrigin, resolveAppOrigin } from "../lib/api-base";

const CONNECT_EVENT_TIMEOUT_MS = 60_000;
const CONNECT_POPUP_DEBUG = process.env.NODE_ENV !== "production";

type MachinesConnectPopupErrorCode =
  | MachinesConnectPopupErrorMessage["code"]
  | "declined"
  | "popup_blocked"
  | "popup_closed"
  | "timeout";

export type MachinesConnectPopupResult =
  | {
      ok: true;
      requestId: string;
      state: string;
      code: string;
      codeVerifier: string;
    }
  | {
      ok: false;
      code: MachinesConnectPopupErrorCode;
      message: string;
      requestId: string | null;
      state: string | null;
      authorizeUrl?: string;
    };

function logMachinesConnectPopup(event: string, metadata?: Record<string, unknown>) {
  if (!CONNECT_POPUP_DEBUG) {
    return;
  }
  if (metadata) {
    console.debug("[machines-connect-popup]", event, metadata);
    return;
  }
  console.debug("[machines-connect-popup]", event);
}

function buildPkceVerifier() {
  const bytes = new Uint8Array(48);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

async function buildPkceChallenge(codeVerifier: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier),
  );
  return toBase64Url(new Uint8Array(digest));
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function buildConnectAuthorizeUrl(options: {
  appOrigin: string;
  requestId: string;
  targetOrigin: string;
}) {
  const url = new URL("/connect/authorize", options.appOrigin);
  url.searchParams.set("requestId", options.requestId);
  url.searchParams.set("targetOrigin", options.targetOrigin);
  return url.toString();
}

export function useMachinesConnectPopup() {
  const inFlightRef = useRef<Promise<MachinesConnectPopupResult> | null>(null);

  const runMachinesConnectPopup = useCallback(
    async (input: {
      clientId: string;
      redirectUri: string;
      scope?: string[];
    }): Promise<MachinesConnectPopupResult> => {
      if (inFlightRef.current) {
        logMachinesConnectPopup("popup_single_flight_reuse");
        return inFlightRef.current;
      }

      const task: Promise<MachinesConnectPopupResult> = (async (): Promise<MachinesConnectPopupResult> => {
        const appOrigin = resolveAppOrigin();
        const targetOrigin = resolveAgentOrigin();
        const state = createMachinesConnectState();
        const codeVerifier = buildPkceVerifier();
        const codeChallenge = await buildPkceChallenge(codeVerifier);

        const requestPayload: MachinesConnectAuthorizeRequest = {
          clientId: input.clientId,
          redirectUri: input.redirectUri,
          scope: input.scope ?? ["*"],
          state,
          codeChallenge,
          codeChallengeMethod: "S256",
          origin: targetOrigin,
        };

        let requestId: string | null = null;
        try {
          logMachinesConnectPopup("authorize_request_create_start", {
            clientId: input.clientId,
            redirectUri: input.redirectUri,
            targetOrigin,
          });
          const created = await createMachinesConnectAuthorizationRequest(requestPayload);
          requestId = created.requestId;
          logMachinesConnectPopup("authorize_request_create_success", {
            requestId,
          });
        } catch (error) {
          logMachinesConnectPopup("authorize_request_create_failure", {
            message: error instanceof Error ? error.message : "unexpected error",
          });
          return {
            ok: false,
            code: "network_error",
            message:
              error instanceof Error
                ? error.message
                : "failed to create authorization request",
            requestId: null,
            state,
          };
        }

        const authorizeUrl = buildConnectAuthorizeUrl({
          appOrigin,
          requestId,
          targetOrigin,
        });
        const popup = window.open(
          authorizeUrl,
          "machines-connect",
          "popup=yes,width=520,height=720",
        );
        if (!popup) {
          logMachinesConnectPopup("popup_blocked", {
            requestId,
          });
          return {
            ok: false,
            code: "popup_blocked",
            message: "popup blocked",
            requestId,
            state,
            authorizeUrl,
          };
        }

        logMachinesConnectPopup("popup_opened", {
          requestId,
        });

        return new Promise<MachinesConnectPopupResult>((resolve) => {
          let done = false;

          const cleanup = () => {
            if (done) return;
            done = true;
            window.removeEventListener("message", onMessage);
            window.clearTimeout(timeoutId);
            window.clearInterval(closedCheckId);
            try {
              popup.close();
            } catch {
              // ignore
            }
          };

          const resolveAndCleanup = (result: MachinesConnectPopupResult) => {
            cleanup();
            resolve(result);
          };

          const onMessage = (event: MessageEvent) => {
            if (event.origin !== appOrigin) {
              return;
            }
            if (!isMachinesConnectPopupEnvelope(event.data)) {
              return;
            }
            if (event.data.payload.requestId !== requestId) {
              return;
            }
            if (
              event.data.payload.state !== state &&
              !(event.data.payload.type === "error" && event.data.payload.state === null)
            ) {
              return;
            }

            const payload = event.data.payload;
            logMachinesConnectPopup("popup_message_received", {
              requestId,
              type: payload.type,
              code: payload.type === "error" ? payload.code : null,
            });
            if (payload.type === "success") {
              resolveAndCleanup({
                ok: true,
                requestId,
                state,
                code: payload.code,
                codeVerifier,
              });
              return;
            }

            if (payload.type === "declined") {
              resolveAndCleanup({
                ok: false,
                code: "declined",
                message: "authorization declined",
                requestId,
                state,
              });
              return;
            }

            resolveAndCleanup({
              ok: false,
              code: payload.code,
              message: payload.message,
              requestId: payload.requestId,
              state: payload.state,
            });
          };

          const timeoutId = window.setTimeout(() => {
            logMachinesConnectPopup("popup_timeout", {
              requestId,
            });
            resolveAndCleanup({
              ok: false,
              code: "timeout",
              message: "connect timed out",
              requestId,
              state,
            });
          }, CONNECT_EVENT_TIMEOUT_MS);

          const closedCheckId = window.setInterval(() => {
            if (popup.closed) {
              logMachinesConnectPopup("popup_closed", {
                requestId,
              });
              resolveAndCleanup({
                ok: false,
                code: "popup_closed",
                message: "popup closed",
                requestId,
                state,
              });
            }
          }, 500);

          window.addEventListener("message", onMessage);
        });
      })().finally(() => {
        inFlightRef.current = null;
      });

      inFlightRef.current = task;
      return task;
    },
    [],
  );

  return {
    runMachinesConnectPopup,
  };
}
