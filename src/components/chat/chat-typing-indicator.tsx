"use client";

import { cn } from "../../lib/utils";

export function ChatTypingIndicator() {
  return (
    <div className="flex justify-start px-[var(--space-4)] md:px-[var(--space-6)] animate-fade-in">
      <div className="inline-flex items-center gap-[var(--space-2)] py-[var(--space-3)]">
        <span
          className={cn(
            "text-[var(--text-base)] font-medium",
            "animate-thinking",
          )}
        >
          thinking
        </span>

        {/* Animated dots */}
        <span className="inline-flex items-center gap-[3px] mt-[1px]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-[3px] h-[3px] rounded-full bg-[var(--agent-text-muted)]"
              style={{
                animation: `typing-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
