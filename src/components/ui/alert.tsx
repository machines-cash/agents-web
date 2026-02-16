import { cn } from "../../lib/utils";

const variants = {
  info: {
    bg: "rgba(123, 47, 255, 0.15)",
    accent: "var(--violet)",
  },
  success: {
    bg: "rgba(34, 197, 94, 0.15)",
    accent: "rgb(34, 197, 94)",
  },
  warning: {
    bg: "rgba(255, 170, 0, 0.15)",
    accent: "rgb(255, 170, 0)",
  },
  error: {
    bg: "rgba(255, 68, 68, 0.15)",
    accent: "rgb(255, 68, 68)",
  },
} as const;

export function Alert({
  variant = "info",
  children,
  className,
}: {
  variant?: keyof typeof variants;
  children: React.ReactNode;
  className?: string;
}) {
  const v = variants[variant];

  return (
    <div
      className={cn(
        "py-[var(--space-4)] px-[var(--space-5)]",
        "rounded-r-[var(--radius-sm)]",
        "text-[var(--text-sm)]",
        className,
      )}
      style={{
        backgroundColor: v.bg,
        borderLeft: `var(--border-thick) solid ${v.accent}`,
      }}
    >
      {children}
    </div>
  );
}
