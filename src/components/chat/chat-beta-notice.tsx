"use client";

import { cn } from "../../lib/utils";

export function ChatBetaNotice({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "shrink-0 w-full mt-[var(--space-2)]",
        "pb-[calc(var(--space-2)+env(safe-area-inset-bottom,0px))]",
        "text-center text-[length:var(--text-xs)] leading-[1.2]",
        "text-[var(--agent-text-muted)] opacity-60",
        className,
      )}
    >
      machines agent is in early beta and can make mistakes.
    </p>
  );
}
