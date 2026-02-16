"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ─── Types ─── */

export type ChatHistoryEntry = {
  chatSessionId: string;
  title: string;
  createdAt: string;
  lastMessageAt: string;
};

/* ─── Constants ─── */

const STORAGE_KEY = "machines.cash.chat.history";
const MAX_ENTRIES = 50;

/* ─── Helpers ─── */

function readFromStorage(storageKey: string): ChatHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeToStorage(storageKey: string, entries: ChatHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(entries));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

/* ─── Hook ─── */

function resolveStorageKey(ownerKey?: string | null) {
  if (!ownerKey) {
    return STORAGE_KEY;
  }
  return `${STORAGE_KEY}.${ownerKey}`;
}

export function useChatHistory(options?: { ownerKey?: string | null }) {
  const [entries, setEntries] = useState<ChatHistoryEntry[]>([]);
  const hydrated = useRef(false);
  const storageKey = resolveStorageKey(options?.ownerKey);

  // Hydrate from localStorage on mount (SSR-safe)
  useEffect(() => {
    const stored = readFromStorage(storageKey);
    setEntries(stored);
    hydrated.current = true;
  }, [storageKey]);

  // Persist to localStorage whenever entries change (skip initial empty state)
  useEffect(() => {
    if (!hydrated.current) return;
    writeToStorage(storageKey, entries);
  }, [entries, storageKey]);

  const addEntry = useCallback(
    (chatSessionId: string, title: string) => {
      setEntries((prev) => {
        // Don't add if already exists — update instead
        const existing = prev.find((e) => e.chatSessionId === chatSessionId);
        if (existing) {
          return prev.map((e) =>
            e.chatSessionId === chatSessionId
              ? { ...e, title, lastMessageAt: new Date().toISOString() }
              : e,
          );
        }

        const now = new Date().toISOString();
        const newEntry: ChatHistoryEntry = {
          chatSessionId,
          title,
          createdAt: now,
          lastMessageAt: now,
        };

        // Add to front, cap at MAX_ENTRIES
        const updated = [newEntry, ...prev].slice(0, MAX_ENTRIES);
        return updated;
      });
    },
    [],
  );

  const updateEntry = useCallback(
    (
      chatSessionId: string,
      updates: Partial<Pick<ChatHistoryEntry, "title" | "lastMessageAt">>,
    ) => {
      setEntries((prev) =>
        prev.map((e) =>
          e.chatSessionId === chatSessionId ? { ...e, ...updates } : e,
        ),
      );
    },
    [],
  );

  const removeEntry = useCallback((chatSessionId: string) => {
    setEntries((prev) =>
      prev.filter((e) => e.chatSessionId !== chatSessionId),
    );
  }, []);

  const clear = useCallback(() => {
    setEntries([]);
  }, []);

  // Sort by lastMessageAt descending
  const sortedEntries = [...entries].sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() -
      new Date(a.lastMessageAt).getTime(),
  );

  return {
    entries: sortedEntries,
    addEntry,
    updateEntry,
    removeEntry,
    clear,
  };
}
