"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { AgentPendingAction } from "@/contracts";
import { cn } from "../../lib/utils";
import { Spinner } from "../ui/spinner";

/* ─── Types ─── */

interface PaymentMinimizedWidgetProps {
  visible: boolean;
  action: AgentPendingAction | null;
  onExpand: () => void;
}

/* ─── Helpers ─── */

function widgetStatusText(status: string | null): string {
  if (status === "processing" || status === "confirmed") return "purchasing...";
  if (status === "awaiting_3ds") return "action needed";
  if (status === "completed") return "purchase confirmed";
  if (status === "failed") return "purchase failed";
  if (status === "expired") return "purchase expired";
  return "processing...";
}

function isTerminal(status: string | null): boolean {
  return status === "completed" || status === "failed" || status === "expired";
}

/* ─── Component ─── */

export function PaymentMinimizedWidget({
  visible,
  action,
  onExpand,
}: PaymentMinimizedWidgetProps) {
  const [mounted, setMounted] = useState(false);
  const status = action?.status ?? null;
  const terminal = isTerminal(status);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={onExpand}
          className={cn(
            "fixed left-1/2 -translate-x-1/2 z-50",
            "flex items-center gap-[var(--space-2)]",
            "px-[var(--space-4)] py-[var(--space-2-5)]",
            "rounded-[var(--radius-full)]",
            "backdrop-blur-[20px] [-webkit-backdrop-filter:blur(20px)]",
            "bg-[var(--agent-glass-bg)]",
            "border border-[var(--agent-glass-border)]",
            "shadow-[var(--shadow-md)]",
            "cursor-pointer",
            "transition-all duration-[var(--duration-fast)]",
            "hover:bg-[var(--agent-surface-elevated)]",
            "active:scale-[0.97]",
          )}
          style={{
            bottom: "calc(100px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {terminal ? (
            status === "completed" ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FF4444"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )
          ) : (
            <Spinner size="sm" />
          )}
          <span
            className={cn(
              "text-[var(--text-xs)]",
              status === "completed" && "text-[#10B981]",
              status === "failed" && "text-[#FF4444]",
              status === "expired" && "text-[#FF4444]",
              !terminal && "text-[var(--agent-text-secondary)]",
            )}
          >
            {widgetStatusText(status)}
          </span>
        </motion.button>
      )}
    </AnimatePresence>,
    document.body,
  );
}
