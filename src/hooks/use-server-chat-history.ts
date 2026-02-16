"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AgentChatSessionListEntry } from "@/contracts";
import {
  deleteAgentChatSession,
  listAgentChatSessions,
  updateAgentChatSession,
} from "../lib/agent-api";

export type ChatHistoryEntry = {
  chatSessionId: string;
  title: string;
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  archivedAt: string | null;
};

const STORAGE_KEY_PREFIX = "machines.cash.chat.history.v2";
const DEFAULT_LIMIT = 50;

function toStorageKey(ownerKey: string | null) {
  return `${STORAGE_KEY_PREFIX}.${ownerKey ?? "anonymous"}`;
}

function toHistoryEntry(session: AgentChatSessionListEntry): ChatHistoryEntry {
  return {
    chatSessionId: session.chatSessionId,
    title: session.title ?? "new chat",
    createdAt: session.createdAt,
    lastMessageAt: session.lastMessageAt ?? session.createdAt,
    messageCount: session.messageCount,
    archivedAt: session.archivedAt,
  };
}

function readFromStorage(storageKey: string): ChatHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeToStorage(storageKey: string, entries: ChatHistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(entries));
  } catch {
    // localStorage unavailable or full
  }
}

function upsertEntry(
  entries: ChatHistoryEntry[],
  entry: ChatHistoryEntry,
): ChatHistoryEntry[] {
  const existing = entries.find((value) => value.chatSessionId === entry.chatSessionId);
  if (!existing) {
    return [entry, ...entries];
  }
  return entries.map((value) =>
    value.chatSessionId === entry.chatSessionId
      ? { ...value, ...entry }
      : value,
  );
}

function sortEntries(entries: ChatHistoryEntry[]) {
  return [...entries].sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() -
      new Date(a.lastMessageAt).getTime(),
  );
}

export function useServerChatHistory(options: {
  agentSessionToken: string;
  ownerKey: string | null;
  enabled?: boolean;
}) {
  const [entries, setEntries] = useState<ChatHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const storageKey = useMemo(() => toStorageKey(options.ownerKey), [options.ownerKey]);

  useEffect(() => {
    setEntries(readFromStorage(storageKey));
  }, [storageKey]);

  useEffect(() => {
    writeToStorage(storageKey, entries);
  }, [entries, storageKey]);

  const refresh = useCallback(async () => {
    if (options.enabled === false) return;
    if (!options.agentSessionToken) return;
    if (loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const collected: AgentChatSessionListEntry[] = [];
      let cursor: string | undefined;

      while (collected.length < DEFAULT_LIMIT) {
        const response = await listAgentChatSessions({
          agentSessionToken: options.agentSessionToken,
          limit: Math.min(DEFAULT_LIMIT - collected.length, 50),
          cursor,
          includeArchived: false,
          includeEmpty: false,
        });
        collected.push(...response.sessions);
        if (!response.nextCursor) {
          break;
        }
        cursor = response.nextCursor;
      }

      setEntries(sortEntries(collected.map(toHistoryEntry)));
    } catch (unknownError) {
      setError(
        unknownError instanceof Error
          ? unknownError.message
          : "failed to load conversations",
      );
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [options.agentSessionToken, options.enabled]);

  useEffect(() => {
    if (options.enabled === false) return;
    if (!options.agentSessionToken) return;
    void refresh();
  }, [options.agentSessionToken, options.enabled, refresh]);

  const addEntry = useCallback((chatSessionId: string, title: string) => {
    const now = new Date().toISOString();
    setEntries((current) =>
      sortEntries(
        upsertEntry(current, {
          chatSessionId,
          title,
          createdAt: now,
          lastMessageAt: now,
          messageCount: 1,
          archivedAt: null,
        }),
      ),
    );
  }, []);

  const updateEntry = useCallback(
    (
      chatSessionId: string,
      updates: Partial<Pick<ChatHistoryEntry, "title" | "lastMessageAt">>,
    ) => {
      setEntries((current) =>
        sortEntries(
          current.map((entry) =>
            entry.chatSessionId === chatSessionId
              ? { ...entry, ...updates }
              : entry,
          ),
        ),
      );
    },
    [],
  );

  const removeEntry = useCallback((chatSessionId: string) => {
    setEntries((current) =>
      current.filter((entry) => entry.chatSessionId !== chatSessionId),
    );
  }, []);

  const clear = useCallback(() => {
    setEntries([]);
  }, []);

  const renameEntry = useCallback(
    async (chatSessionId: string, title: string) => {
      if (!options.agentSessionToken) {
        return;
      }
      const nextTitle = title.trim();
      if (!nextTitle) {
        return;
      }
      const updated = await updateAgentChatSession({
        agentSessionToken: options.agentSessionToken,
        chatSessionId,
        title: nextTitle,
      });
      setEntries((current) =>
        sortEntries(upsertEntry(current, toHistoryEntry(updated))),
      );
    },
    [options.agentSessionToken],
  );

  const archiveEntry = useCallback(
    async (chatSessionId: string) => {
      if (!options.agentSessionToken) {
        return;
      }
      await updateAgentChatSession({
        agentSessionToken: options.agentSessionToken,
        chatSessionId,
        archived: true,
      });
      removeEntry(chatSessionId);
    },
    [options.agentSessionToken, removeEntry],
  );

  const deleteEntry = useCallback(
    async (chatSessionId: string) => {
      if (!options.agentSessionToken) {
        return;
      }
      await deleteAgentChatSession({
        agentSessionToken: options.agentSessionToken,
        chatSessionId,
      });
      removeEntry(chatSessionId);
    },
    [options.agentSessionToken, removeEntry],
  );

  return useMemo(
    () => ({
      entries,
      isLoading,
      error,
      addEntry,
      updateEntry,
      removeEntry,
      clear,
      refresh,
      renameEntry,
      archiveEntry,
      deleteEntry,
    }),
    [
      addEntry,
      archiveEntry,
      clear,
      deleteEntry,
      entries,
      error,
      isLoading,
      refresh,
      removeEntry,
      renameEntry,
      updateEntry,
    ],
  );
}
