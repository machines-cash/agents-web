"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  EIP6963AnnounceProviderEvent,
  EIP6963ProviderDetail,
  EIP6963ProviderInfo,
  EIP1193Provider,
  WalletDescriptor,
  WalletSource,
} from "../types/wallets";

type DiscoveryStatus = "idle" | "discovering" | "ready";

type WalletDiscoveryState = {
  status: DiscoveryStatus;
  wallets: WalletDescriptor[];
};

const ANNOUNCE_EVENT = "eip6963:announceProvider";
const REQUEST_EVENT = "eip6963:requestProvider";
const ETHEREUM_READY_EVENT = "ethereum#initialized";

function isClient() {
  return typeof window !== "undefined";
}

function isEIP1193Provider(value: unknown): value is EIP1193Provider {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as { request?: unknown }).request === "function"
  );
}

function isValidEip6963Detail(detail: unknown): detail is EIP6963ProviderDetail {
  if (!detail || typeof detail !== "object") return false;
  const candidate = detail as Partial<EIP6963ProviderDetail>;
  return (
    typeof candidate.info === "object" &&
    candidate.info !== null &&
    typeof (candidate.info as { uuid?: unknown }).uuid === "string" &&
    typeof (candidate.info as { name?: unknown }).name === "string" &&
    typeof (candidate.info as { icon?: unknown }).icon === "string" &&
    isEIP1193Provider(candidate.provider)
  );
}

function randomUuid(seed: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${seed}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function withWalletId(info: EIP6963ProviderInfo): EIP6963ProviderInfo {
  if (info.walletId) {
    return info;
  }
  return {
    ...info,
    walletId: info.rdns ?? info.uuid,
  };
}

function buildDescriptor(
  source: WalletSource,
  info: EIP6963ProviderInfo,
  provider: EIP1193Provider,
): WalletDescriptor {
  return {
    id: `${source}:${info.uuid}`,
    source,
    info,
    provider,
    detectedAt: Date.now(),
  };
}

export function useWalletDiscovery() {
  const [state, setState] = useState<WalletDiscoveryState>(() => ({
    status: isClient() ? "discovering" : "idle",
    wallets: [],
  }));
  const [rescanTick, setRescanTick] = useState(0);

  const rescan = useCallback(() => {
    if (isClient()) {
      setState({ status: "discovering", wallets: [] });
    }
    setRescanTick((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!isClient()) {
      return;
    }

    let cancelled = false;
    const registry = new Map<string, WalletDescriptor>();

    const emit = () => {
      if (cancelled) return;
      const wallets = Array.from(registry.values()).sort((a, b) =>
        a.info.name.localeCompare(b.info.name),
      );
      setState({
        status: wallets.length > 0 ? "ready" : "discovering",
        wallets,
      });
    };

    const registerDetail = (detail: WalletDescriptor) => {
      if (registry.has(detail.id)) return;
      registry.set(detail.id, detail);
      emit();
    };

    const handleAnnounce = (event: Event) => {
      const detail = (event as EIP6963AnnounceProviderEvent).detail;
      if (!isValidEip6963Detail(detail)) {
        return;
      }
      registerDetail(
        buildDescriptor("eip6963", withWalletId(detail.info), detail.provider),
      );
    };

    const discoverLegacy = () => {
      const anyWindow = window as unknown as {
        ethereum?: EIP1193Provider & { providers?: unknown };
      };
      const { ethereum } = anyWindow;
      if (!ethereum) {
        emit();
        return;
      }

      const bucket = new Set<EIP1193Provider>();

      if (Array.isArray(ethereum.providers)) {
        ethereum.providers.forEach((provider) => {
          if (isEIP1193Provider(provider)) {
            bucket.add(provider);
          }
        });
      }

      if (isEIP1193Provider(ethereum)) {
        bucket.add(ethereum);
      }

      Array.from(bucket).forEach((provider, index) => {
        const info = withWalletId({
          uuid: randomUuid(`legacy-${index}`),
          walletId: `legacy-${index}`,
          name: `wallet ${index + 1}`,
          icon: "",
        });
        const source: WalletSource = provider === ethereum ? "window" : "provider-array";
        registerDetail(buildDescriptor(source, info, provider));
      });

      emit();
    };

    window.addEventListener(ANNOUNCE_EVENT, handleAnnounce as EventListener);
    window.dispatchEvent(new CustomEvent(REQUEST_EVENT));
    const rebound = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(REQUEST_EVENT));
    }, 750);

    discoverLegacy();
    window.addEventListener(ETHEREUM_READY_EVENT, discoverLegacy, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener(ANNOUNCE_EVENT, handleAnnounce as EventListener);
      window.removeEventListener(ETHEREUM_READY_EVENT, discoverLegacy as EventListener);
      window.clearTimeout(rebound);
    };
  }, [rescanTick]);

  return useMemo(
    () => ({
      wallets: state.wallets,
      status: state.status,
      ready: state.status === "ready",
      hasWallets: state.wallets.length > 0,
      rescan,
    }),
    [rescan, state],
  );
}
