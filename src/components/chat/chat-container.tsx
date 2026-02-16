"use client";

import { cn } from "../../lib/utils";

export function ChatContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col flex-1 min-h-0",
        "w-full max-w-[var(--container-md)] mx-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}
