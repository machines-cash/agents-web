"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";
import { Spinner } from "./spinner";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "secondary" | "ghost" | "text_link";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-light",
          "transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--violet)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--agent-bg)]",
          "disabled:pointer-events-none disabled:opacity-50",
          "active:scale-[0.98] active:opacity-70",
          "duration-[var(--duration-fast)]",
          {
            "bg-[var(--violet)] text-white hover:opacity-85 rounded-[var(--radius-sm)]":
              variant === "primary",
            "bg-[var(--orange)] text-white hover:opacity-85 rounded-[var(--radius-sm)]":
              variant === "accent",
            "bg-[var(--agent-surface)] text-[var(--agent-text-primary)] hover:opacity-80 rounded-[var(--radius-sm)]":
              variant === "secondary",
            "text-[var(--agent-text-primary)] hover:bg-[var(--agent-surface-elevated)] rounded-[var(--radius-sm)]":
              variant === "ghost",
            "text-[var(--violet)] hover:opacity-80 bg-transparent":
              variant === "text_link",
          },
          {
            "h-9 px-[var(--space-4)] text-[var(--text-xs)] gap-[var(--space-2)]":
              size === "sm",
            "h-11 px-[var(--space-6)] text-[var(--text-sm)] gap-[var(--space-2)]":
              size === "md",
            "h-14 px-[var(--space-8)] text-[var(--text-base)] gap-[var(--space-3)]":
              size === "lg",
          },
          className,
        )}
        {...props}
      >
        {loading ? <Spinner size="sm" /> : children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
