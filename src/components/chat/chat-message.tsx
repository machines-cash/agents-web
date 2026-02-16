"use client";

import { useState, useCallback } from "react";
import type { AgentChatMessage } from "@/contracts";
import { cn } from "../../lib/utils";
import { MarkdownContent } from "./markdown-content";

/* ─── Inline icons (16×16, stroke) ─── */

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ThumbUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      <path d="M14 2l-2 7h6.16a2 2 0 0 1 1.96 2.4l-1.38 6.9A2 2 0 0 1 16.78 20H7V11l3.08-7.7A1 1 0 0 1 14 2z" />
    </svg>
  );
}

function ThumbDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 2H20a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
      <path d="M10 22l2-7H5.84a2 2 0 0 1-1.96-2.4l1.38-6.9A2 2 0 0 1 7.22 4H17v9l-3.08 7.7A1 1 0 0 1 10 22z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

/* ─── Action button ─── */

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "w-[28px] h-[28px] rounded-[8px]",
        "flex items-center justify-center",
        "text-[var(--agent-text-muted)]",
        "hover:bg-[var(--agent-surface-elevated)] hover:text-[var(--agent-text-secondary)]",
        "active:scale-[0.9]",
        "transition-all duration-[var(--duration-fast)]",
      )}
    >
      {icon}
    </button>
  );
}

/* ─── Copy button with feedback ─── */

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  return (
    <ActionButton
      icon={copied ? <CheckIcon /> : <CopyIcon />}
      label={copied ? "copied" : "copy"}
      onClick={handleCopy}
    />
  );
}

/* ─── Message component ─── */

export function ChatMessage({
  message,
  isLatest,
}: {
  message: AgentChatMessage;
  isLatest: boolean;
}) {
  const isUser = message.role === "user";
  const isRedacted = Boolean(message.redacted);
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn(
        "group flex w-full",
        isUser ? "justify-end" : "justify-start",
        isLatest &&
          (isUser ? "animate-slide-in-right" : "animate-message-enter"),
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-[var(--space-1)]",
          isUser ? "items-end max-w-[85%] md:max-w-[75%]" : "items-start max-w-full",
        )}
      >
        {/* Message content */}
        <div
          className={cn(
            "text-[var(--text-base)] break-words",
            isUser
              ? [
                  "w-fit max-w-full",
                  "px-[var(--space-5)] py-[var(--space-2-5)]",
                  "bg-[var(--agent-user-bubble)]",
                  "border border-[var(--agent-user-bubble-border)]",
                  "rounded-[20px]",
                  "leading-relaxed",
                  isRedacted && "italic text-[var(--agent-text-muted)]",
                ]
              : ["max-w-full", "leading-[var(--leading-relaxed)]"],
          )}
        >
          {isUser ? (
            message.content
          ) : (
            <MarkdownContent content={message.content} />
          )}
        </div>

        {/* Action bar — all messages */}
        <div
          className={cn(
            "flex items-center gap-[2px] mt-[2px]",
            isUser ? "-mr-[6px]" : "-ml-[6px]",
            "opacity-0 group-hover:opacity-100",
            "transition-opacity duration-[var(--duration-normal)]",
            isLatest && "opacity-100",
          )}
        >
          <CopyButton content={message.content} />
          {isUser ? (
            <ActionButton icon={<EditIcon />} label="edit" />
          ) : (
            <>
              <ActionButton icon={<ThumbUpIcon />} label="helpful" />
              <ActionButton icon={<ThumbDownIcon />} label="not helpful" />
            </>
          )}
        </div>

        {/* Timestamp — hidden, revealed on hover */}
        <span
          className={cn(
            "text-[var(--text-xs)] text-[var(--agent-text-muted)]",
            "opacity-0 group-hover:opacity-100",
            "transition-opacity duration-[var(--duration-normal)]",
            isUser ? "pr-[var(--space-2)]" : "",
          )}
        >
          {time}
        </span>
      </div>
    </div>
  );
}
