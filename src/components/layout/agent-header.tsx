"use client";

import type { AgentSession } from "@/contracts";
import Link from "next/link";
import { cn } from "../../lib/utils";
import { MachinesMark } from "../ui/logo";
import { Button } from "../ui/button";

export function AgentHeader({
  session,
  onLogout,
  onNewChat,
  onToggleSidebar,
  className,
}: {
  session: AgentSession | null;
  onLogout?: () => void;
  onNewChat?: () => void;
  onToggleSidebar?: () => void;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "relative flex items-center justify-between shrink-0",
        "px-[var(--space-4)] md:px-[var(--space-6)]",
        "h-[52px] md:h-[64px]",
        "backdrop-blur-[20px] bg-transparent",
        "pt-[env(safe-area-inset-top)]",
        "animate-fade-in",
        className,
      )}
    >
      {/* Left: hamburger (mobile) or logo (when no sidebar) */}
      <div className="flex items-center">
        {onToggleSidebar ? (
          <>
            {/* Hamburger — mobile only (sidebar covers desktop) */}
            <button
              type="button"
              onClick={onToggleSidebar}
              className={cn(
                "md:hidden",
                "w-[32px] h-[32px] rounded-full",
                "flex items-center justify-center",
                "text-[var(--agent-text-secondary)]",
                "hover:bg-[var(--agent-surface-elevated)]",
                "transition-colors duration-[var(--duration-fast)]",
                "active:scale-[0.92]",
              )}
              aria-label="open sidebar"
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
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            {/* On desktop, sidebar has the logo — so hide mark here */}
          </>
        ) : (
          /* No sidebar available — show mark as fallback */
          <Link href="/" className="flex items-center">
            <MachinesMark size={24} rounded="sm" />
          </Link>
        )}
      </div>

      {/* Center: product name */}
      <span
        className={cn(
          "absolute left-1/2 -translate-x-1/2",
          "text-[var(--text-sm)] font-medium",
          "text-[var(--agent-text-primary)]",
        )}
      >
        machines agent
      </span>

      {/* Right: actions */}
      <div className="flex items-center gap-[var(--space-2)]">
        {/* New chat button — only on mobile (desktop sidebar has it) */}
        {onNewChat && (
          <button
            type="button"
            onClick={onNewChat}
            className={cn(
              "md:hidden",
              "w-[32px] h-[32px] rounded-full",
              "flex items-center justify-center",
              "text-[var(--agent-text-secondary)]",
              "hover:bg-[var(--agent-surface-elevated)]",
              "transition-colors duration-[var(--duration-fast)]",
              "active:scale-[0.92]",
            )}
            aria-label="new chat"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
          </button>
        )}

        {/* Logout */}
        {session && onLogout && (
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </Button>
        )}
      </div>
    </header>
  );
}
