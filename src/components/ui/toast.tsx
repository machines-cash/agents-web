"use client";

import { cn } from "../../lib/utils";

const dotColors = {
  success: "rgb(34, 197, 94)",
  error: "rgb(255, 68, 68)",
  info: "var(--violet)",
} as const;

export function Toast({
  variant = "info",
  message,
  visible,
}: {
  variant?: keyof typeof dotColors;
  message: string;
  visible: boolean;
}) {
  return (
    <div
      className={cn(
        "fixed z-50 left-1/2 -translate-x-1/2",
        "bottom-[calc(env(safe-area-inset-bottom,0px)+var(--space-6))]",
        "md:bottom-auto md:top-[var(--space-6)] md:left-auto md:right-[var(--space-6)] md:translate-x-0",
        "flex items-center gap-[var(--space-3)]",
        "bg-[var(--agent-surface)] rounded-[var(--radius-sm)]",
        "py-[var(--space-4)] px-[var(--space-5)]",
        "shadow-[var(--shadow-md)]",
        "text-[var(--text-sm)] text-[var(--agent-text-primary)]",
        "transition-all duration-[var(--duration-normal)]",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2 pointer-events-none",
      )}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: dotColors[variant] }}
      />
      {message}
    </div>
  );
}
