import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full font-[var(--font-mono)] text-[var(--text-sm)]",
          "py-[var(--space-3)] px-[var(--space-4)]",
          "rounded-[var(--radius-sm)]",
          "border bg-[var(--agent-bg)] text-[var(--agent-text-primary)]",
          "placeholder:text-[var(--agent-text-muted)]",
          "transition-colors duration-[var(--duration-fast)]",
          "focus:outline-none",
          error
            ? "border-[#FF4444] focus:border-[#FF4444]"
            : "border-[var(--gray-600)] focus:border-[var(--violet)]",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full font-[var(--font-mono)] text-[var(--text-sm)]",
          "py-[var(--space-3)] px-[var(--space-4)]",
          "rounded-[var(--radius-sm)]",
          "border bg-[var(--agent-bg)] text-[var(--agent-text-primary)]",
          "placeholder:text-[var(--agent-text-muted)]",
          "transition-colors duration-[var(--duration-fast)]",
          "focus:outline-none",
          "min-h-[100px] resize-y",
          error
            ? "border-[#FF4444] focus:border-[#FF4444]"
            : "border-[var(--gray-600)] focus:border-[var(--violet)]",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";

export { Input, Textarea };
