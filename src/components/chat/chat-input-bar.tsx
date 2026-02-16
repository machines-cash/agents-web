"use client";

import { useRef, useState, useCallback } from "react";
import { cn } from "../../lib/utils";
import { ChatInputPill } from "./chat-input-pill";

export function ChatInputBar({
  onSend,
  onStop,
  disabled,
  isSending,
  suggestions = [],
  placeholder = "message machines…",
}: {
  onSend: (message: string) => void;
  onStop?: () => void;
  disabled: boolean;
  isSending: boolean;
  suggestions?: string[];
  placeholder?: string;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isSending) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, isSending, onSend]);

  const canSend = value.trim().length > 0 && !disabled && !isSending;

  /* Filter suggestions based on current input — subtle inline hints */
  const filteredSuggestions =
    value.trim().length > 0
      ? suggestions.filter((s) =>
          s.toLowerCase().startsWith(value.trim().toLowerCase()),
        )
      : [];

  return (
    <div
      className={cn(
        "shrink-0",
        "px-[var(--space-4)] md:px-[var(--space-6)]",
        "pt-[var(--space-2)]",
        "pb-[var(--space-2)]",
      )}
    >
      {/* Subtle inline suggestion hints — small tappable chips above the input */}
      {filteredSuggestions.length > 0 && !isSending && (
        <div className="flex flex-wrap gap-[var(--space-2)] mb-[var(--space-2)]">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className={cn(
                "px-[var(--space-3)] py-[5px]",
                "rounded-full",
                "text-[length:var(--text-xs)] text-[var(--agent-text-muted)]",
                "border border-[var(--agent-border)]",
                "hover:text-[var(--agent-text-secondary)] hover:border-[var(--agent-border-strong)]",
                "transition-colors duration-[var(--duration-fast)]",
                "active:scale-[0.96]",
              )}
              onClick={() => {
                onSend(suggestion);
                setValue("");
                if (textareaRef.current) {
                  textareaRef.current.style.height = "auto";
                }
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Floating pill input */}
      <ChatInputPill
        value={value}
        onChange={setValue}
        onSend={handleSend}
        onStop={onStop}
        disabled={disabled}
        isSending={isSending}
        canSend={canSend}
        placeholder={placeholder}
        textareaRef={textareaRef}
      />
    </div>
  );
}
