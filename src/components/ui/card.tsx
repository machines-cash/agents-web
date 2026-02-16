import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outlined" | "elevated" | "interactive";
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[var(--radius-md)] p-[var(--space-6)]",
          {
            "bg-[var(--agent-surface)]": variant === "default",
            "bg-transparent border border-[var(--gray-600)]":
              variant === "outlined",
            "bg-[var(--agent-surface)] shadow-[var(--shadow-md)]":
              variant === "elevated",
            "bg-[var(--agent-surface)] transition-all duration-[var(--duration-fast)] cursor-pointer hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] active:scale-[0.98]":
              variant === "interactive",
          },
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

export { Card };
