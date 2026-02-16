"use client";

import { useCallback, type KeyboardEvent } from "react";
import { cn } from "../../lib/utils";

export interface ChatInputPillProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled: boolean;
  isSending: boolean;
  canSend: boolean;
  placeholder?: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  className?: string;
}

export function ChatInputPill({
  value,
  onChange,
  onSend,
  onStop,
  onKeyDown,
  disabled,
  isSending,
  canSend,
  placeholder = "message machines…",
  textareaRef,
  className,
}: ChatInputPillProps) {
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [textareaRef]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
    onKeyDown?.(e);
  };

  return (
    <div
      className={cn(
        "flex items-end gap-[var(--space-2)]",
        "backdrop-blur-[20px] bg-[var(--agent-glass-bg)]",
        "border border-[var(--agent-glass-border)]",
        "rounded-[var(--radius-full)]",
        "px-[var(--space-3)] py-[var(--space-2)]",
        "shadow-[var(--shadow-sm)]",
        "focus-within:border-[var(--agent-border-strong)]",
        "transition-all duration-[var(--duration-normal)]",
        className,
      )}
    >
      {/* Plus button */}
      <button
        type="button"
        className={cn(
          "shrink-0 w-[34px] h-[34px] rounded-full",
          "flex items-center justify-center",
          "text-[var(--agent-text-secondary)]",
          "hover:bg-[var(--agent-surface-elevated)]",
          "transition-colors duration-[var(--duration-fast)]",
          "active:scale-[0.92]",
        )}
        aria-label="attachment menu"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          autoResize();
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          "flex-1 bg-transparent border-none outline-none resize-none",
          "text-[var(--text-base)] text-[var(--agent-text-primary)]",
          "placeholder:text-[rgba(255,255,255,0.25)]",
          "min-h-[24px] max-h-[160px]",
          "py-[5px]",
        )}
      />

      {/* Action button — stop (while sending) or send (when text ready) */}
      {isSending ? (
        <button
          type="button"
          onClick={onStop}
          className={cn(
            "shrink-0 w-[34px] h-[34px] rounded-full",
            "flex items-center justify-center",
            "bg-[var(--agent-surface-elevated)] text-[var(--agent-text-primary)]",
            "transition-all duration-[var(--duration-normal)]",
            "active:scale-[0.92]",
            "animate-fade-in",
          )}
          aria-label="stop generating"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        </button>
      ) : canSend ? (
        <button
          type="button"
          onClick={onSend}
          className={cn(
            "shrink-0 w-[34px] h-[34px] rounded-full",
            "flex items-center justify-center",
            "bg-[var(--violet)] text-white",
            "transition-all duration-[var(--duration-normal)]",
            "active:scale-[0.92]",
            "animate-fade-in",
          )}
          aria-label="send message"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
