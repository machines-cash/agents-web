"use client";

import type {
  AgentActionConfirmResponse,
  AgentActionStatusResponse,
  AgentBillingDetails,
  AgentChatMessage,
  AgentChatMessageContext,
  AgentChatSessionResponse,
  AgentPendingAction,
  ChatEventEnvelope,
} from "@/contracts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  confirmAgentChatAction,
  createAgentChatSession,
  getAgentChatActionStatus,
  getAgentChatSession,
  sendAgentChatMessage,
  submitAgentChatActionThreeDsCode,
} from "../lib/agent-api";
import { ApiRequestError } from "../lib/api-base";
import { readStoredAgentSession } from "../lib/agent-session-storage";

const actionPollIntervalMs = 1500;
const actionPollTimeoutMs = 5 * 60 * 1000;

export type AgentChatState =
  | "idle"
  | "initializing"
  | "sending"
  | "awaiting_confirmation"
  | "error";

function isUnauthorizedError(error: unknown) {
  if (error instanceof ApiRequestError) {
    return error.status === 401;
  }
  if (error instanceof Error) {
    return /unauthorized|session expired/i.test(error.message);
  }
  return false;
}

function isChatSessionNotFoundError(error: unknown) {
  if (error instanceof ApiRequestError) {
    return (
      error.status === 404 &&
      (error.code === "not_found" || /chat session not found/i.test(error.message))
    );
  }
  if (error instanceof Error) {
    return /chat session not found/i.test(error.message);
  }
  return false;
}

function toUserFriendlyChatError(error: unknown) {
  const raw =
    error instanceof ApiRequestError
      ? (error.message || error.code || "").toLowerCase()
      : error instanceof Error
        ? error.message.toLowerCase()
        : "";

  if (raw.includes("unsupported consumer route group")) {
    return "that feature is not available yet.";
  }
  if (raw.includes("identity verification") || raw.includes("kyc")) {
    return "verification is required first. complete it and try again.";
  }
  if (raw.includes("cannot get /api/") || raw.includes("/api/2022-06-09/providers/amazon/items")) {
    return "I couldn’t fetch deals right now. share an amazon url and I’ll continue.";
  }
  if (raw.includes("forbidden")) {
    return "I can’t do that in this chat right now.";
  }
  if (raw.includes("action expired")) {
    return "purchase confirmation expired. retry to refresh it.";
  }
  if (raw.includes("action not pending")) {
    return "that purchase confirmation is no longer active. ask me to prepare it again.";
  }
  if (raw.includes("not found")) {
    return "I couldn’t find that. try again.";
  }
  if (raw.includes("network") || raw.includes("timeout") || raw.includes("upstream")) {
    return "I hit a temporary issue. please try again.";
  }
  return "something went wrong. please try again.";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTerminalActionStatus(status: string) {
  return status === "completed" || status === "failed" || status === "expired";
}

function mergeActionStatus(
  actions: AgentPendingAction[],
  status: AgentActionStatusResponse,
) {
  const nextAction: AgentPendingAction = {
    id: status.actionId,
    type: "purchase_confirm",
    status: status.status,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    confirmedAt: new Date().toISOString(),
    workflowId: status.workflowId ?? null,
    orderId: status.orderId ?? null,
    quoteId: status.quoteId ?? null,
    paymentStatus: status.paymentStatus ?? null,
    message: status.message ?? null,
    billingSummary: status.billingSummary ?? null,
    billingDetails: status.billingDetails ?? null,
    progress: status.progress ?? null,
  };

  const existingIndex = actions.findIndex((entry) => entry.id === status.actionId);
  if (existingIndex < 0) {
    return [nextAction, ...actions];
  }
  const existing = actions[existingIndex]!;
  const merged: AgentPendingAction = {
    ...existing,
    status: status.status,
    workflowId: status.workflowId ?? existing.workflowId ?? null,
    orderId: status.orderId ?? existing.orderId ?? null,
    quoteId: status.quoteId ?? existing.quoteId ?? null,
    paymentStatus: status.paymentStatus ?? existing.paymentStatus ?? null,
    message: status.message ?? existing.message ?? null,
    billingSummary: status.billingSummary ?? existing.billingSummary ?? null,
    billingDetails: status.billingDetails ?? existing.billingDetails ?? null,
    progress: status.progress ?? existing.progress ?? null,
  };
  const next = [...actions];
  next[existingIndex] = merged;
  return next;
}

export function applyConfirmActionResponse(
  actions: AgentPendingAction[],
  requestedActionId: string,
  response: AgentActionConfirmResponse,
) {
  const canonicalActionId = response.actionId || requestedActionId;
  const nextActions =
    canonicalActionId === requestedActionId
      ? actions
      : actions.filter((entry) => entry.id !== requestedActionId);

  return {
    canonicalActionId,
    actions: mergeActionStatus(nextActions, {
      actionId: canonicalActionId,
      status: response.status,
      workflowId: response.workflowId,
      orderId: response.orderId ?? null,
      quoteId: response.quoteId ?? null,
      paymentStatus: response.paymentStatus ?? null,
      message: response.message ?? null,
      progress: response.progress,
      billingSummary: response.billingSummary,
      billingDetails: response.billingDetails,
    }),
  };
}

export function useAgentChat(options: {
  agentSessionToken: string;
  initialChatSessionId?: string;
  enabled?: boolean;
  onUnauthorized?: () => Promise<boolean>;
  onSessionUnavailable?: (chatSessionId: string) => void;
}) {
  const [chatSessionId, setChatSessionId] = useState<string | null>(
    options.initialChatSessionId ?? null,
  );
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [pendingActions, setPendingActions] = useState<AgentPendingAction[]>([]);
  const [lastEvents, setLastEvents] = useState<ChatEventEnvelope[]>([]);
  const [kycSummary, setKycSummary] = useState<AgentChatSessionResponse["kyc"] | null>(
    null,
  );
  const [state, setState] = useState<AgentChatState>("initializing");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pollingActionsRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef(true);
  const unavailableSessionRef = useRef<string | null>(null);
  const onSessionUnavailableRef = useRef(options.onSessionUnavailable);
  const initInFlightKeyRef = useRef<string | null>(null);
  const syncedSessionKeyRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      pollingActionsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!options.initialChatSessionId) {
      unavailableSessionRef.current = null;
    }
  }, [options.initialChatSessionId]);

  useEffect(() => {
    onSessionUnavailableRef.current = options.onSessionUnavailable;
  }, [options.onSessionUnavailable]);

  const resolveSessionToken = useCallback(() => {
    const stored = readStoredAgentSession();
    if (stored?.agentSessionToken) {
      return stored.agentSessionToken;
    }
    return options.agentSessionToken;
  }, [options.agentSessionToken]);

  const withUnauthorizedRetry = useCallback(
    async <T>(request: (sessionToken: string) => Promise<T>) => {
      const currentSessionToken = resolveSessionToken();
      try {
        return await request(currentSessionToken);
      } catch (unknownError) {
        if (!isUnauthorizedError(unknownError) || !options.onUnauthorized) {
          throw unknownError;
        }

        const refreshed = await options.onUnauthorized();
        if (!refreshed) {
          throw new Error("please reconnect to continue.");
        }

        return request(resolveSessionToken());
      }
    },
    [options.onUnauthorized, resolveSessionToken],
  );

  const appendAssistantMessage = useCallback((content: string | null | undefined) => {
    const normalized = (content ?? "").trim();
    if (!normalized) return;
    setMessages((current) => {
      const last = current[current.length - 1];
      if (last?.role === "assistant" && last.content === normalized) {
        return current;
      }
      return [
        ...current,
        {
          role: "assistant",
          content: normalized,
          createdAt: new Date().toISOString(),
        },
      ];
    });
  }, []);

  const syncSession = useCallback(
    async (targetChatSessionId: string) => {
      let syncedSessionToken = "";
      const loaded = await withUnauthorizedRetry((sessionToken) => {
        syncedSessionToken = sessionToken;
        return getAgentChatSession({
          agentSessionToken: sessionToken,
          chatSessionId: targetChatSessionId,
        });
      });
      if (!mountedRef.current) return;

      setMessages(loaded.messages);
      setPendingActions(loaded.pendingActions);
      setKycSummary(loaded.kyc ?? null);
      const awaitingConfirmation = loaded.pendingActions.some(
        (action) => action.status === "pending" && action.type === "purchase_confirm",
      );
      setState(awaitingConfirmation ? "awaiting_confirmation" : "idle");
      setError(null);
      if (syncedSessionToken) {
        syncedSessionKeyRef.current = `${syncedSessionToken}:${targetChatSessionId}`;
      }
      return loaded.pendingActions;
    },
    [withUnauthorizedRetry],
  );

  const pollActionStatus = useCallback(
    async (actionId: string, targetChatSessionId: string) => {
      if (pollingActionsRef.current.has(actionId)) return;
      pollingActionsRef.current.add(actionId);
      const startedAt = Date.now();

      try {
        while (mountedRef.current && Date.now() - startedAt < actionPollTimeoutMs) {
          const response = await withUnauthorizedRetry((sessionToken) =>
            getAgentChatActionStatus({
              agentSessionToken: sessionToken,
              actionId,
            }),
          );
          if (!mountedRef.current) return;

          setPendingActions((current) => mergeActionStatus(current, response));
          appendAssistantMessage(response.assistantMessage);

          if (isTerminalActionStatus(response.status)) {
            await syncSession(targetChatSessionId);
            return;
          }

          await sleep(actionPollIntervalMs);
        }
      } catch (pollError) {
        if (!mountedRef.current) return;
        setError(toUserFriendlyChatError(pollError));
      } finally {
        pollingActionsRef.current.delete(actionId);
      }
    },
    [appendAssistantMessage, syncSession, withUnauthorizedRetry],
  );

  const beginPollingForActiveActions = useCallback(
    (actions: AgentPendingAction[], targetChatSessionId: string) => {
      for (const action of actions) {
        if (action.type !== "purchase_confirm") continue;
        if (
          action.status === "confirmed" ||
          action.status === "processing" ||
          action.status === "awaiting_3ds"
        ) {
          void pollActionStatus(action.id, targetChatSessionId);
        }
      }
    },
    [pollActionStatus],
  );

  const resetTransientChatState = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    pollingActionsRef.current.clear();
    initInFlightKeyRef.current = null;
    syncedSessionKeyRef.current = null;
    setMessages([]);
    setPendingActions([]);
    setLastEvents([]);
    setKycSummary(null);
    setError(null);
    setState("idle");
    setChatSessionId(options.initialChatSessionId ?? null);
  }, [options.initialChatSessionId]);

  useEffect(() => {
    if (options.enabled === false) {
      resetTransientChatState();
      return;
    }
    if (!options.agentSessionToken) {
      resetTransientChatState();
      return;
    }
    if (
      options.initialChatSessionId &&
      unavailableSessionRef.current === options.initialChatSessionId
    ) {
      setState("idle");
      return;
    }

    const usableInitialChatSessionId =
      options.initialChatSessionId &&
      unavailableSessionRef.current !== options.initialChatSessionId
        ? options.initialChatSessionId
        : null;
    const requestedChatSessionId = usableInitialChatSessionId ?? chatSessionId;
    const resolvedSessionToken = resolveSessionToken();
    const alreadySyncedKey = requestedChatSessionId
      ? `${resolvedSessionToken}:${requestedChatSessionId}`
      : null;
    const initKey = `${resolvedSessionToken}:${requestedChatSessionId ?? "__create__"}`;

    if (initInFlightKeyRef.current) {
      return;
    }
    if (alreadySyncedKey && syncedSessionKeyRef.current === alreadySyncedKey) {
      return;
    }

    let active = true;
    initInFlightKeyRef.current = initKey;

    const initialize = async () => {
      setState("initializing");
      setError(null);
      let targetChatSessionId: string | null = requestedChatSessionId;
      try {
        if (!targetChatSessionId) {
          targetChatSessionId = (
            await withUnauthorizedRetry((sessionToken) =>
              createAgentChatSession({
                agentSessionToken: sessionToken,
              }),
            )
          ).chatSessionId;
        }

        if (!active) {
          return;
        }
        setChatSessionId(targetChatSessionId);
        const actions = await syncSession(targetChatSessionId);
        if (!active || !actions) {
          return;
        }
        beginPollingForActiveActions(actions, targetChatSessionId);
      } catch (sessionError) {
        if (!active) {
          return;
        }
        if (
          targetChatSessionId &&
          options.initialChatSessionId &&
          targetChatSessionId === options.initialChatSessionId &&
          isChatSessionNotFoundError(sessionError)
        ) {
          if (unavailableSessionRef.current !== targetChatSessionId) {
            unavailableSessionRef.current = targetChatSessionId;
            onSessionUnavailableRef.current?.(targetChatSessionId);
          }
          syncedSessionKeyRef.current = null;
          setChatSessionId(null);
          setMessages([]);
          setPendingActions([]);
          setLastEvents([]);
          setKycSummary(null);
          setState("idle");
          setError(null);
          return;
        }
        setState("error");
        setError(toUserFriendlyChatError(sessionError));
      } finally {
        if (initInFlightKeyRef.current === initKey) {
          initInFlightKeyRef.current = null;
        }
      }
    };

    void initialize();

    return () => {
      active = false;
      if (initInFlightKeyRef.current === initKey) {
        initInFlightKeyRef.current = null;
      }
    };
  }, [
    beginPollingForActiveActions,
    chatSessionId,
    resolveSessionToken,
    options.agentSessionToken,
    options.enabled,
    options.initialChatSessionId,
    resetTransientChatState,
    syncSession,
    withUnauthorizedRetry,
  ]);

  const sendMessage = useCallback(
    async (
      message: string,
      options?: {
        context?: AgentChatMessageContext;
      },
    ) => {
      const targetChatSessionId = chatSessionId;
      if (!targetChatSessionId) {
        throw new Error("chat session unavailable");
      }

      const trimmed = message.trim();
      if (!trimmed) {
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      setState("sending");
      setError(null);
      setMessages((current) => [
        ...current,
        {
          role: "user",
          content: trimmed,
          createdAt: new Date().toISOString(),
        },
      ]);

      try {
        const response = await withUnauthorizedRetry((sessionToken) =>
          sendAgentChatMessage({
            agentSessionToken: sessionToken,
            chatSessionId: targetChatSessionId,
            message: trimmed,
            context: options?.context,
            signal: controller.signal,
          }),
        );

        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content: response.assistantMessage,
            createdAt: new Date().toISOString(),
          },
        ]);
        setLastEvents(response.events);
        const actions = await syncSession(targetChatSessionId);
        if (actions) {
          beginPollingForActiveActions(actions, targetChatSessionId);
        }
      } catch (sendError) {
        // User stopped generating — not an error.
        if (sendError instanceof DOMException && sendError.name === "AbortError") {
          setState("idle");
          return;
        }

        if (isChatSessionNotFoundError(sendError)) {
          try {
            const replacement = await withUnauthorizedRetry((sessionToken) =>
              createAgentChatSession({
                agentSessionToken: sessionToken,
              }),
            );

            setChatSessionId(replacement.chatSessionId);

            const retried = await withUnauthorizedRetry((sessionToken) =>
              sendAgentChatMessage({
                agentSessionToken: sessionToken,
                chatSessionId: replacement.chatSessionId,
                message: trimmed,
                context: options?.context,
                signal: controller.signal,
              }),
            );

            setMessages((current) => [
              ...current,
              {
                role: "assistant",
                content: retried.assistantMessage,
                createdAt: new Date().toISOString(),
              },
            ]);
            setLastEvents(retried.events);
            const actions = await syncSession(replacement.chatSessionId);
            if (actions) {
              beginPollingForActiveActions(actions, replacement.chatSessionId);
            }
            return;
          } catch (retryError) {
            if (retryError instanceof DOMException && retryError.name === "AbortError") {
              setState("idle");
              return;
            }
            setState("error");
            setError(toUserFriendlyChatError(retryError));
            return;
          }
        }

        setState("error");
        setError(toUserFriendlyChatError(sendError));
      } finally {
        abortRef.current = null;
      }
    },
    [beginPollingForActiveActions, chatSessionId, syncSession, withUnauthorizedRetry],
  );

  const stopGenerating = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState("idle");
  }, []);

  const confirmAction = useCallback(
    async (
      actionId: string,
      options?: { billingOverride?: AgentBillingDetails },
    ) => {
      const targetChatSessionId = chatSessionId;
      if (!targetChatSessionId) {
        throw new Error("chat session unavailable");
      }
      setState("sending");
      setError(null);
      try {
        const response = await withUnauthorizedRetry((sessionToken) =>
          confirmAgentChatAction({
            agentSessionToken: sessionToken,
            actionId,
            billingOverride: options?.billingOverride,
          }),
        );
        const canonicalActionId = response.actionId || actionId;
        appendAssistantMessage(response.assistantMessage);
        if (response.events) {
          setLastEvents(response.events);
        }
        setPendingActions((current) =>
          applyConfirmActionResponse(current, actionId, response).actions,
        );
        setState("idle");

        if (
          response.status === "processing" ||
          response.status === "awaiting_3ds" ||
          response.status === "confirmed"
        ) {
          void pollActionStatus(canonicalActionId, targetChatSessionId);
        } else {
          await syncSession(targetChatSessionId);
        }
      } catch (confirmError) {
        setState("error");
        setError(toUserFriendlyChatError(confirmError));
      }
    },
    [
      appendAssistantMessage,
      chatSessionId,
      pollActionStatus,
      syncSession,
      withUnauthorizedRetry,
    ],
  );

  const submitThreeDsCode = useCallback(
    async (actionId: string, code: string) => {
      const targetChatSessionId = chatSessionId;
      if (!targetChatSessionId) {
        throw new Error("chat session unavailable");
      }
      setState("sending");
      setError(null);
      try {
        const response = await withUnauthorizedRetry((sessionToken) =>
          submitAgentChatActionThreeDsCode({
            agentSessionToken: sessionToken,
            actionId,
            code,
          }),
        );
        appendAssistantMessage(response.assistantMessage);
        setPendingActions((current) => mergeActionStatus(current, response));
        setState("idle");

        if (isTerminalActionStatus(response.status)) {
          await syncSession(targetChatSessionId);
        } else {
          void pollActionStatus(actionId, targetChatSessionId);
        }
      } catch (submitError) {
        setState("error");
        setError(toUserFriendlyChatError(submitError));
      }
    },
    [appendAssistantMessage, chatSessionId, pollActionStatus, syncSession, withUnauthorizedRetry],
  );

  return useMemo(
    () => ({
      state,
      error,
      chatSessionId,
      messages,
      pendingActions,
      lastEvents,
      kycSummary,
      sendMessage,
      confirmAction,
      submitThreeDsCode,
      stopGenerating,
      reload: chatSessionId ? () => syncSession(chatSessionId) : null,
    }),
    [
      chatSessionId,
      confirmAction,
      error,
      lastEvents,
      kycSummary,
      messages,
      pendingActions,
      sendMessage,
      state,
      stopGenerating,
      submitThreeDsCode,
      syncSession,
    ],
  );
}
