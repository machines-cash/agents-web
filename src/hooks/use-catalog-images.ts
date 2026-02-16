"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AgentCatalogItem } from "@/contracts";
import {
  resolveAgentCatalogImages,
  type AgentCatalogImageResolveResult,
} from "../lib/agent-api";

const SESSION_CACHE_KEY = "agent.catalog.images.v1";
const SUCCESS_TTL_MS = 24 * 60 * 60 * 1000;
const NO_IMAGE_TTL_MS = 6 * 60 * 60 * 1000;
const FAILURE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

const TRACKING_QUERY_PREFIXES = ["utm_"];
const TRACKING_QUERY_KEYS = new Set([
  "fbclid",
  "gclid",
  "mc_eid",
  "mkt_tok",
  "ref",
  "ref_",
  "spm",
]);

type SessionCacheEntry = {
  imageUrl: string | null;
  expiresAt: number;
};

type SessionCache = Record<string, SessionCacheEntry>;

function normalizeCatalogUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    if (parsed.username || parsed.password) {
      return null;
    }

    parsed.hash = "";
    parsed.hostname = parsed.hostname.toLowerCase();

    for (const key of [...parsed.searchParams.keys()]) {
      const lower = key.toLowerCase();
      if (
        TRACKING_QUERY_KEYS.has(lower) ||
        TRACKING_QUERY_PREFIXES.some((prefix) => lower.startsWith(prefix))
      ) {
        parsed.searchParams.delete(key);
      }
    }

    parsed.searchParams.sort();

    if (!parsed.pathname) {
      parsed.pathname = "/";
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function loadSessionCache() {
  if (typeof window === "undefined") return {} as SessionCache;

  try {
    const raw = window.sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return {} as SessionCache;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {} as SessionCache;
    }
    return parsed as SessionCache;
  } catch {
    return {} as SessionCache;
  }
}

function pruneSessionCache(cache: SessionCache, now: number) {
  const entries = Object.entries(cache).filter(
    ([, value]) =>
      value &&
      typeof value === "object" &&
      Number.isFinite(value.expiresAt) &&
      value.expiresAt > now,
  );

  if (entries.length <= MAX_CACHE_ENTRIES) {
    return Object.fromEntries(entries) as SessionCache;
  }

  entries.sort((left, right) => left[1].expiresAt - right[1].expiresAt);
  return Object.fromEntries(entries.slice(entries.length - MAX_CACHE_ENTRIES)) as SessionCache;
}

function persistSessionCache(cache: SessionCache) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Keep cache best-effort only.
  }
}

function buildItemKey(item: AgentCatalogItem, index: number) {
  return item.asin ?? item.url ?? `${item.title}:${index}`;
}

function ttlForResult(result: AgentCatalogImageResolveResult | null) {
  if (!result) {
    return FAILURE_TTL_MS;
  }
  if (result.imageUrl) {
    return SUCCESS_TTL_MS;
  }
  return result.source === "none" ? NO_IMAGE_TTL_MS : FAILURE_TTL_MS;
}

function chunkArray<T>(items: T[], chunkSize: number) {
  const output: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    output.push(items.slice(index, index + chunkSize));
  }
  return output;
}

export function useCatalogImages(options: {
  items: AgentCatalogItem[];
  agentSessionToken: string;
}) {
  const [resolvedByUrl, setResolvedByUrl] = useState<SessionCache>({});
  const inFlightUrlsRef = useRef(new Set<string>());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const now = Date.now();
    const cache = pruneSessionCache(loadSessionCache(), now);
    persistSessionCache(cache);

    const cacheHits: SessionCache = {};
    for (const item of options.items) {
      if (item.imageUrl || !item.url) continue;
      const normalized = normalizeCatalogUrl(item.url);
      if (!normalized) continue;
      const cached = cache[normalized];
      if (cached && cached.expiresAt > now) {
        cacheHits[normalized] = cached;
      }
    }

    if (Object.keys(cacheHits).length === 0) {
      return;
    }

    setResolvedByUrl((current) => ({
      ...current,
      ...cacheHits,
    }));
  }, [options.items]);

  useEffect(() => {
    if (!options.agentSessionToken) return;

    const pendingByNormalized = new Map<
      string,
      {
        itemKey: string;
        url: string;
      }
    >();

    for (const [index, item] of options.items.entries()) {
      if (item.imageUrl || !item.url) continue;
      const normalized = normalizeCatalogUrl(item.url);
      if (!normalized) continue;
      const existing = resolvedByUrl[normalized];
      if (existing && existing.expiresAt > Date.now()) {
        continue;
      }
      if (inFlightUrlsRef.current.has(normalized)) {
        continue;
      }
      pendingByNormalized.set(normalized, {
        itemKey: buildItemKey(item, index),
        url: item.url,
      });
    }

    const pendingEntries = [...pendingByNormalized.entries()];
    if (pendingEntries.length === 0) {
      return;
    }

    for (const [normalizedUrl] of pendingEntries) {
      inFlightUrlsRef.current.add(normalizedUrl);
    }

    let cancelled = false;

    const resolveMissingImages = async () => {
      const resolvedUpdates: SessionCache = {};
      const cacheUpdates: SessionCache = {};

      try {
        const chunks = chunkArray(pendingEntries, 8);
        for (const chunk of chunks) {
          const requestItems = chunk.map(([, value]) => ({
            itemKey: value.itemKey,
            url: value.url,
          }));
          const response = await resolveAgentCatalogImages({
            agentSessionToken: options.agentSessionToken,
            items: requestItems,
          });

          const resultByItemKey = new Map(
            response.results.map((result) => [result.itemKey, result]),
          );

          for (const [normalizedUrl, requestItem] of chunk) {
            const result = resultByItemKey.get(requestItem.itemKey) ?? null;
            const entry = {
              imageUrl: result?.imageUrl ?? null,
              expiresAt: Date.now() + ttlForResult(result),
            };
            resolvedUpdates[normalizedUrl] = entry;
            cacheUpdates[normalizedUrl] = entry;
          }
        }
      } catch {
        for (const [normalizedUrl] of pendingEntries) {
          const entry = {
            imageUrl: null,
            expiresAt: Date.now() + FAILURE_TTL_MS,
          };
          resolvedUpdates[normalizedUrl] = entry;
          cacheUpdates[normalizedUrl] = entry;
        }
      } finally {
        for (const [normalizedUrl] of pendingEntries) {
          inFlightUrlsRef.current.delete(normalizedUrl);
        }
      }

      if (cancelled) return;

      if (Object.keys(resolvedUpdates).length > 0) {
        setResolvedByUrl((current) => ({
          ...current,
          ...resolvedUpdates,
        }));
      }

      if (Object.keys(cacheUpdates).length > 0) {
        const now = Date.now();
        const currentCache = pruneSessionCache(loadSessionCache(), now);
        const nextCache = pruneSessionCache(
          {
            ...currentCache,
            ...cacheUpdates,
          },
          now,
        );
        persistSessionCache(nextCache);
      }
    };

    void resolveMissingImages();

    return () => {
      cancelled = true;
    };
  }, [options.agentSessionToken, options.items, resolvedByUrl]);

  return useMemo(
    () =>
      options.items.map((item) => {
        if (item.imageUrl || !item.url) {
          return item;
        }

        const normalized = normalizeCatalogUrl(item.url);
        if (!normalized) {
          return item;
        }

        if (!Object.prototype.hasOwnProperty.call(resolvedByUrl, normalized)) {
          return item;
        }

        const cached = resolvedByUrl[normalized];
        if (!cached || cached.expiresAt <= Date.now()) {
          return item;
        }

        return {
          ...item,
          imageUrl: cached.imageUrl,
        } satisfies AgentCatalogItem;
      }),
    [options.items, resolvedByUrl],
  );
}
