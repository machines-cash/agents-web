"use client";

import { useState } from "react";
import type { ChatEventEnvelope } from "@/contracts";
import { cn } from "../../lib/utils";

const eventIcons: Record<string, string> = {
  tool_call: "⚙",
  purchase_started: "⏳",
  purchase_result: "✓",
  unsupported_operation: "⚠",
};

const eventLabels: Record<string, string> = {
  tool_call: "tool call",
  requires_purchase_confirmation: "purchase confirmation required",
  purchase_started: "processing purchase",
  purchase_result: "purchase result",
  unsupported_operation: "unsupported operation",
};

export function ChatToolEvent({ event }: { event: ChatEventEnvelope }) {
  const [expanded, setExpanded] = useState(false);

  const icon = eventIcons[event.type] ?? "→";
  const label = eventLabels[event.type] ?? event.type;

  return (
    <div className="animate-fade-in">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-[var(--space-2)] w-full text-left",
          "px-[var(--space-3)] py-[var(--space-2)]",
          "border border-dashed border-[var(--gray-600)]",
          "rounded-[var(--radius-sm)]",
          "text-[var(--text-xs)] font-[var(--font-mono)] text-[var(--agent-text-muted)]",
          "hover:border-[var(--agent-text-secondary)] transition-colors duration-[var(--duration-fast)]",
        )}
      >
        <span>{icon}</span>
        <span className="flex-1">{label}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "transition-transform duration-[var(--duration-fast)]",
            expanded && "rotate-180",
          )}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <pre
          className={cn(
            "mt-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)]",
            "text-[var(--text-xs)] font-[var(--font-mono)] text-[var(--agent-text-muted)]",
            "bg-[var(--agent-bg)] rounded-[var(--radius-sm)]",
            "overflow-x-auto whitespace-pre-wrap break-all",
            "animate-fade-in",
          )}
        >
          {JSON.stringify(event, null, 2)}
        </pre>
      )}
    </div>
  );
}
