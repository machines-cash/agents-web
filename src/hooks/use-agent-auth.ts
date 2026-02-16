"use client";

import type { AgentSession } from "@/contracts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  connectAgentWithBankr,
  exchangeMachinesConnectAuthorizationCode,
  logoutAgentSession,
  refreshMachinesConnectSession,
  revokeMachinesConnectSession,
} from "../lib/agent-api";
import {
  clearAgentSession,
  isAgentSessionExpired,
  isAgentSessionNearExpiry,
  readStoredAgentSession,
  writeAgentSession,
} from "../lib/agent-session-storage";
import { resolveAgentOrigin } from "../lib/api-base";
import { useMachinesConnectPopup } from "./use-machines-connect-popup";

export type AgentAuthState =
  | "auth_checking"
  | "connect_in_progress"
  | "bankr_in_progress"
  | "bridge_in_progress"
  | "login_required"
  | "chat_ready"
  | "error";

const AGENT_AUTH_DEBUG = process.env.NODE_ENV !== "production";

function logAgentAuth(event: string, metadata?: Record<string, unknown>) {
  if (!AGENT_AUTH_DEBUG) {
    return;
  }
  if (metadata) {
    console.debug("[agent-auth]", event, metadata);
    return;
  }
  console.debug("[agent-auth]", event);
}

function resolveConnectRedirectUri() {
  const configured = process.env.NEXT_PUBLIC_MACHINES_CONNECT_REDIRECT_URI?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  return `${resolveAgentOrigin()}/machines`;
}

function resolveConnectScopes() {
  const configured = process.env.NEXT_PUBLIC_MACHINES_CONNECT_SCOPE?.trim();
  if (!configured) {
    return ["*"];
  }
  const scopes = configured
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);
  return scopes.length > 0 ? Array.from(new Set(scopes)) : ["*"];
}

export function useAgentAuth() {
  const [state, setState] = useState<AgentAuthState>("auth_checking");
  const [session, setSession] = useState<AgentSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectFallbackUrl, setConnectFallbackUrl] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);
  const loginPromiseRef = useRef<Promise<void> | null>(null);
  const bankrPromiseRef = useRef<Promise<void> | null>(null);

  const connectClientId = useMemo(
    () => process.env.NEXT_PUBLIC_MACHINES_CONNECT_CLIENT_ID?.trim() || "agent_web",
    [],
  );
  const connectRedirectUri = useMemo(resolveConnectRedirectUri, []);
  const connectScopes = useMemo(resolveConnectScopes, []);

  const refreshAheadMs = useMemo(() => {
    const raw = Number(process.env.NEXT_PUBLIC_AGENT_REFRESH_AHEAD_SECONDS ?? "180");
    if (Number.isFinite(raw) && raw > 0) {
      return raw * 1000;
    }
    return 180_000;
  }, []);

  const { runMachinesConnectPopup } = useMachinesConnectPopup();

  const setLoginRequired = useCallback(() => {
    setSession(null);
    setState("login_required");
    setError(null);
    setConnectFallbackUrl(null);
  }, []);

  const setReadySession = useCallback((nextSession: AgentSession) => {
    writeAgentSession(nextSession);
    setSession(nextSession);
    setState("chat_ready");
    setError(null);
    setConnectFallbackUrl(null);
  }, []);

  const loginWithMachines = useCallback(async (source: string = "button_machines") => {
    if (loginPromiseRef.current) {
      logAgentAuth("machines_login_reuse", { source });
      return loginPromiseRef.current;
    }
    if (bankrPromiseRef.current) {
      logAgentAuth("machines_login_ignored_bankr_in_progress", { source });
      return bankrPromiseRef.current;
    }

    const task = (async () => {
      logAgentAuth("machines_login_start", { source });
      setState("connect_in_progress");
      setError(null);
      setConnectFallbackUrl(null);

      const popupResult = await runMachinesConnectPopup({
        clientId: connectClientId,
        redirectUri: connectRedirectUri,
        scope: connectScopes,
      });

      if (!popupResult.ok) {
        logAgentAuth("machines_login_popup_failed", {
          source,
          code: popupResult.code,
        });
        setState("login_required");
        if (popupResult.code === "declined") {
          setError("authorization declined");
          return;
        }
        if (popupResult.code === "popup_blocked") {
          setError("popup blocked. allow popups or continue in this tab.");
          setConnectFallbackUrl(popupResult.authorizeUrl ?? null);
          return;
        }
        setError(popupResult.message);
        return;
      }

      try {
        logAgentAuth("machines_login_exchange_start", { source });
        const exchanged = await exchangeMachinesConnectAuthorizationCode({
          grantType: "authorization_code",
          clientId: connectClientId,
          code: popupResult.code,
          redirectUri: connectRedirectUri,
          codeVerifier: popupResult.codeVerifier,
        });
        setReadySession(exchanged);
        logAgentAuth("machines_login_success", {
          source,
          authProvider: exchanged.authProvider ?? null,
        });
      } catch (exchangeError) {
        setState("error");
        logAgentAuth("machines_login_exchange_failed", {
          source,
          message: exchangeError instanceof Error ? exchangeError.message : "unknown",
        });
        setError(
          exchangeError instanceof Error
            ? exchangeError.message
            : "failed to exchange authorization code",
        );
      }
    })().finally(() => {
      loginPromiseRef.current = null;
    });

    loginPromiseRef.current = task;
    return task;
  }, [
    connectClientId,
    connectRedirectUri,
    connectScopes,
    runMachinesConnectPopup,
    setReadySession,
  ]);

  const loginWithBankr = useCallback(async (source: string = "button_bankr") => {
    if (bankrPromiseRef.current) {
      logAgentAuth("bankr_login_reuse", { source });
      return bankrPromiseRef.current;
    }
    if (loginPromiseRef.current) {
      logAgentAuth("bankr_login_ignored_machines_in_progress", { source });
      return loginPromiseRef.current;
    }

    const task = (async () => {
      logAgentAuth("bankr_login_start", { source });
      setState("bankr_in_progress");
      setError(null);
      setConnectFallbackUrl(null);

      try {
        const connected = await connectAgentWithBankr();
        setReadySession(connected);
        logAgentAuth("bankr_login_success", {
          source,
          authProvider: connected.authProvider ?? null,
        });
      } catch (bankrError) {
        const rawMessage =
          bankrError instanceof Error ? bankrError.message : "bankr login failed";
        const normalizedMessage =
          rawMessage.toLowerCase().includes("disabled") ||
          rawMessage.toLowerCase().includes("not found")
            ? "bankr login is currently unavailable."
            : rawMessage;

        logAgentAuth("bankr_login_failed", {
          source,
          message: rawMessage,
        });
        setState("login_required");
        setError(normalizedMessage);
      }
    })().finally(() => {
      bankrPromiseRef.current = null;
    });

    bankrPromiseRef.current = task;
    return task;
  }, [setReadySession]);

  const refreshSessionSilently = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const task = (async () => {
      const storedAgentSession = readStoredAgentSession();

      if (!storedAgentSession) {
        clearAgentSession();
        setLoginRequired();
        return false;
      }

      if (!storedAgentSession.refreshToken) {
        if (!isAgentSessionExpired(storedAgentSession)) {
          setReadySession(storedAgentSession);
          return true;
        }

        clearAgentSession();
        setLoginRequired();
        return false;
      }

      try {
        const refreshed = await refreshMachinesConnectSession({
          clientId: connectClientId,
          refreshToken: storedAgentSession.refreshToken,
        });
        setReadySession(refreshed);
        return true;
      } catch {
        if (!isAgentSessionExpired(storedAgentSession)) {
          setReadySession(storedAgentSession);
          return true;
        }

        clearAgentSession();
        setLoginRequired();
        return false;
      }
    })().finally(() => {
      refreshPromiseRef.current = null;
    });

    refreshPromiseRef.current = task;
    return task;
  }, [connectClientId, setLoginRequired, setReadySession]);

  const logout = useCallback(() => {
    const current = readStoredAgentSession() ?? session;

    clearAgentSession();
    setSession(null);
    setError(null);
    setConnectFallbackUrl(null);
    setState("login_required");

    void (async () => {
      if (current?.refreshToken) {
        try {
          await revokeMachinesConnectSession({
            clientId: connectClientId,
            refreshToken: current.refreshToken,
          });
        } catch {
          // ignore logout API failures; local sign-out already completed
        }
      } else if (current?.agentSessionToken) {
        try {
          await logoutAgentSession(current.agentSessionToken);
        } catch {
          // ignore logout API failures; local sign-out already completed
        }
      }
    })();
  }, [connectClientId, session]);

  const hardReset = useCallback(() => {
    clearAgentSession();
    setSession(null);
    setError(null);
    setConnectFallbackUrl(null);
    setState("login_required");
  }, []);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;

    const boot = async () => {
      const stored = readStoredAgentSession();

      if (stored && !isAgentSessionExpired(stored)) {
        setReadySession(stored);
        if (stored.refreshToken && isAgentSessionNearExpiry(stored, refreshAheadMs)) {
          void refreshSessionSilently();
        }
        return;
      }

      if (stored?.refreshToken) {
        const refreshed = await refreshSessionSilently();
        if (refreshed) {
          return;
        }
      }

      clearAgentSession();
      setLoginRequired();
    };

    void boot();
  }, [refreshAheadMs, refreshSessionSilently, setLoginRequired, setReadySession]);

  useEffect(() => {
    if (state !== "chat_ready") {
      return;
    }

    const interval = window.setInterval(() => {
      const current = readStoredAgentSession() ?? session;
      if (!current?.refreshToken) {
        return;
      }
      if (isAgentSessionNearExpiry(current, refreshAheadMs)) {
        void refreshSessionSilently();
      }
    }, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [refreshAheadMs, refreshSessionSilently, session, state]);

  return useMemo(
    () => ({
      state,
      error,
      session,
      connectEnabled: true,
      connectFallbackUrl,
      loginWithMachines,
      loginWithBankr,
      logout,
      hardReset,
      refreshSessionSilently,
    }),
    [
      connectFallbackUrl,
      error,
      loginWithMachines,
      loginWithBankr,
      logout,
      hardReset,
      refreshSessionSilently,
      session,
      state,
    ],
  );
}
