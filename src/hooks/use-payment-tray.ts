"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { AgentPendingAction } from "@/contracts";

/* ─── Types ─── */

export type PaymentTrayView = "pay" | "status" | "minimized" | "closed";

export interface PaymentTrayState {
  /** Currently-tracked purchase action (most relevant non-terminal, or latest) */
  activeAction: AgentPendingAction | null;
  /** Which view is currently displayed */
  view: PaymentTrayView;
  /** Whether the full tray is open */
  trayOpen: boolean;
  /** Whether the billing edit sub-tray is open */
  billingEditOpen: boolean;
  /** Convenience flags */
  isPending: boolean;
  isProcessing: boolean;
  isAwaitingThreeDs: boolean;
  isTerminal: boolean;
  terminalResult: "completed" | "failed" | "expired" | null;
}

export interface PaymentTrayActions {
  openTray: () => void;
  closeTray: () => void;
  minimizeTray: () => void;
  expandFromMinimized: () => void;
  openBillingEdit: () => void;
  closeBillingEdit: () => void;
}

const TERMINAL_STATUSES = ["completed", "failed", "expired"];
const PROCESSING_STATUSES = ["confirmed", "processing"];
const AUTO_CLOSE_DELAY = 3000;
const MINIMIZED_AUTO_CLOSE_DELAY = 2500;

/* ─── Hook ─── */

export function usePaymentTray(options: {
  purchaseActions: AgentPendingAction[];
  isBusy: boolean;
}): PaymentTrayState & PaymentTrayActions {
  const [view, setView] = useState<PaymentTrayView>("closed");
  const [billingEditOpen, setBillingEditOpen] = useState(false);

  /** Track which action ID we're currently showing so we don't re-trigger */
  const trackedActionIdRef = useRef<string | null>(null);
  /** Track previous status to detect transitions */
  const prevStatusRef = useRef<string | null>(null);
  /** Auto-close timer ref */
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ─── Select the most relevant action ─── */
  const activeAction = useMemo(() => {
    // Prefer non-terminal actions
    const active = options.purchaseActions.find(
      (a) => !TERMINAL_STATUSES.includes(a.status),
    );
    return active ?? options.purchaseActions[0] ?? null;
  }, [options.purchaseActions]);

  const status = activeAction?.status ?? null;
  const isPending = status === "pending";
  const isProcessing = PROCESSING_STATUSES.includes(status ?? "");
  const isAwaitingThreeDs = status === "awaiting_3ds";
  const isTerminal = TERMINAL_STATUSES.includes(status ?? "");
  const terminalResult = isTerminal
    ? (status as "completed" | "failed" | "expired")
    : null;

  /* ─── Auto-open when a new pending action appears ─── */
  useEffect(() => {
    if (!activeAction) return;
    if (
      activeAction.status === "pending" &&
      activeAction.id !== trackedActionIdRef.current
    ) {
      trackedActionIdRef.current = activeAction.id;
      prevStatusRef.current = "pending";
      setView("pay");
      setBillingEditOpen(false);
    }
  }, [activeAction]);

  /* ─── Watch status transitions ─── */
  useEffect(() => {
    if (!activeAction) return;
    const prevStatus = prevStatusRef.current;
    const newStatus = activeAction.status;
    if (prevStatus === newStatus) return;
    prevStatusRef.current = newStatus;

    // Clear any pending auto-close
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }

    // pending → confirmed/processing: switch to status view
    if (
      prevStatus === "pending" &&
      PROCESSING_STATUSES.includes(newStatus)
    ) {
      setView("status");
      setBillingEditOpen(false);
    }

    // Any → terminal: schedule auto-close
    if (TERMINAL_STATUSES.includes(newStatus)) {
      const delay =
        view === "minimized"
          ? MINIMIZED_AUTO_CLOSE_DELAY
          : AUTO_CLOSE_DELAY;
      autoCloseTimerRef.current = setTimeout(() => {
        setView("closed");
        trackedActionIdRef.current = null;
        prevStatusRef.current = null;
      }, delay);
    }
  }, [activeAction?.status, view]);

  /* ─── Cleanup on unmount ─── */
  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, []);

  /* ─── Actions ─── */

  const openTray = useCallback(() => {
    if (!activeAction) return;
    if (isPending) {
      setView("pay");
    } else {
      setView("status");
    }
  }, [activeAction, isPending]);

  const closeTray = useCallback(() => {
    setBillingEditOpen(false);
    // If processing, minimize instead of fully closing
    if (isProcessing || isAwaitingThreeDs) {
      setView("minimized");
    } else {
      setView("closed");
    }
  }, [isProcessing, isAwaitingThreeDs]);

  const minimizeTray = useCallback(() => {
    setBillingEditOpen(false);
    setView("minimized");
  }, []);

  const expandFromMinimized = useCallback(() => {
    setView("status");
  }, []);

  const openBillingEdit = useCallback(() => {
    setBillingEditOpen(true);
  }, []);

  const closeBillingEdit = useCallback(() => {
    setBillingEditOpen(false);
  }, []);

  const trayOpen = view === "pay" || view === "status";

  return {
    activeAction,
    view,
    trayOpen,
    billingEditOpen,
    isPending,
    isProcessing,
    isAwaitingThreeDs,
    isTerminal,
    terminalResult,
    openTray,
    closeTray,
    minimizeTray,
    expandFromMinimized,
    openBillingEdit,
    closeBillingEdit,
  };
}
