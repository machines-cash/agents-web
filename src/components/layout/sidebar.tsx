"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MachinesMark } from "../ui/logo";
import { cn } from "../../lib/utils";

/* ─── Props ─── */

type ChatHistoryEntry = {
  chatSessionId: string;
  title: string;
  lastMessageAt: string;
};

type SidebarProps = {
  entries: ChatHistoryEntry[];
  activeChatSessionId: string | null;
  onSelectChat: (chatSessionId: string) => void;
  onNewChat: () => void;
  onClose?: () => void;
  walletAddress?: string | null;
  onRenameChat?: (chatSessionId: string, newTitle: string) => Promise<void>;
  onArchiveChat?: (chatSessionId: string) => Promise<void>;
  onDeleteChat?: (chatSessionId: string) => Promise<void>;
};

/* ─── Dropdown menu item ─── */

function DropdownMenuItem({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-[var(--space-2)]",
        "px-[var(--space-3)] py-[6px]",
        "text-[13px] text-left",
        "transition-colors duration-[var(--duration-fast)]",
        destructive
          ? "text-red-400 hover:bg-red-500/10"
          : "text-[var(--agent-text-secondary)] hover:bg-[var(--agent-surface-elevated)]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/* ─── Chat entry item ─── */

function ChatEntryItem({
  entry,
  isActive,
  menuOpen,
  onMenuToggle,
  onSelect,
  onRename,
  onArchive,
  onDelete,
}: {
  entry: ChatHistoryEntry;
  isActive: boolean;
  menuOpen: boolean;
  onMenuToggle: (open: boolean) => void;
  onSelect: () => void;
  onRename?: (chatSessionId: string, newTitle: string) => Promise<void>;
  onArchive?: (chatSessionId: string) => Promise<void>;
  onDelete?: (chatSessionId: string) => Promise<void>;
}) {
  const [renaming, setRenaming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [renameValue, setRenameValue] = useState(entry.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLButtonElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        dotRef.current &&
        !dotRef.current.contains(target)
      ) {
        onMenuToggle(false);
      }
    };
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("touchstart", handleDown);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("touchstart", handleDown);
    };
  }, [menuOpen, onMenuToggle]);

  // Focus rename input
  useEffect(() => {
    if (renaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renaming]);

  const handleConfirmRename = useCallback(async () => {
    if (submittingRef.current) return;
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === entry.title) {
      setRenaming(false);
      setRenameValue(entry.title);
      return;
    }
    submittingRef.current = true;
    try {
      await onRename?.(entry.chatSessionId, trimmed);
    } finally {
      submittingRef.current = false;
      setRenaming(false);
    }
  }, [renameValue, entry.title, entry.chatSessionId, onRename]);

  const handleStartRename = useCallback(() => {
    onMenuToggle(false);
    setRenameValue(entry.title);
    setRenaming(true);
  }, [entry.title, onMenuToggle]);

  const handleArchive = useCallback(() => {
    onMenuToggle(false);
    void onArchive?.(entry.chatSessionId);
  }, [entry.chatSessionId, onArchive, onMenuToggle]);

  const handleStartDelete = useCallback(() => {
    onMenuToggle(false);
    setConfirmingDelete(true);
  }, [onMenuToggle]);

  const handleConfirmDelete = useCallback(() => {
    setConfirmingDelete(false);
    void onDelete?.(entry.chatSessionId);
  }, [entry.chatSessionId, onDelete]);

  const hasActions = onRename || onArchive || onDelete;

  // Delete confirmation mode
  if (confirmingDelete) {
    return (
      <div
        className={cn(
          "w-full",
          "px-[var(--space-2)] py-[6px]",
          "rounded-[8px]",
          "bg-red-500/8",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] text-red-400 truncate">
            delete this chat?
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleConfirmDelete}
              className={cn(
                "text-[12px] text-red-400 hover:text-red-300",
                "px-2 py-0.5 rounded-[6px]",
                "hover:bg-red-500/10",
                "transition-colors duration-[var(--duration-fast)]",
              )}
            >
              yes
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className={cn(
                "text-[12px] text-[var(--agent-text-muted)] hover:text-[var(--agent-text-secondary)]",
                "px-2 py-0.5 rounded-[6px]",
                "hover:bg-[var(--agent-surface-elevated)]",
                "transition-colors duration-[var(--duration-fast)]",
              )}
            >
              no
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group/entry">
      <button
        type="button"
        onClick={renaming ? undefined : onSelect}
        className={cn(
          "w-full text-left",
          "px-[var(--space-2)] py-[6px]",
          "rounded-[8px]",
          "transition-colors duration-[var(--duration-fast)]",
          isActive
            ? "bg-[var(--agent-surface-elevated)]"
            : "hover:bg-[var(--agent-surface-elevated)]",
        )}
      >
        <div className="flex items-center gap-[var(--space-2)]">
          {renaming ? (
            <input
              ref={renameInputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleConfirmRename();
                }
                if (e.key === "Escape") {
                  setRenaming(false);
                  setRenameValue(entry.title);
                }
              }}
              onBlur={() => void handleConfirmRename()}
              className={cn(
                "flex-1 min-w-0 bg-transparent border-none outline-none",
                "text-[13px] text-[var(--agent-text-primary)]",
                "px-0 py-0",
              )}
            />
          ) : (
            <span
              className={cn(
                "text-[13px] truncate flex-1 min-w-0",
                isActive
                  ? "text-[var(--agent-text-primary)]"
                  : "text-[var(--agent-text-secondary)]",
              )}
            >
              {entry.title}
            </span>
          )}

          {/* Three-dot button */}
          {hasActions && !renaming && (
            <button
              ref={dotRef}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMenuToggle(!menuOpen);
              }}
              className={cn(
                "shrink-0 w-[24px] h-[24px] rounded-[6px]",
                "flex items-center justify-center",
                "text-[var(--agent-text-muted)] hover:text-[var(--agent-text-secondary)]",
                "hover:bg-[var(--agent-surface-elevated)]",
                "transition-all duration-[var(--duration-fast)]",
                menuOpen
                  ? "opacity-100"
                  : "opacity-0 group-hover/entry:opacity-100",
              )}
              aria-label="chat options"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>
          )}
        </div>
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            ref={menuRef}
            className={cn(
              "absolute right-0 top-full mt-1 z-50",
              "w-[160px] py-[4px]",
              "bg-[#1a1a1a] border border-[var(--agent-border)]",
              "rounded-[8px] shadow-[var(--shadow-md)]",
            )}
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            {onRename && (
              <DropdownMenuItem
                icon={
                  <svg
                    width="14"
                    height="14"
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
                }
                label="rename"
                onClick={handleStartRename}
              />
            )}
            {onArchive && (
              <DropdownMenuItem
                icon={
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="3" width="20" height="5" rx="1" />
                    <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
                    <path d="M10 12h4" />
                  </svg>
                }
                label="archive"
                onClick={handleArchive}
              />
            )}
            {onDelete && (
              <DropdownMenuItem
                icon={
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                }
                label="delete"
                onClick={handleStartDelete}
                destructive
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Sidebar Content (shared between desktop and mobile) ─── */

function SidebarContent({
  entries,
  activeChatSessionId,
  onSelectChat,
  onNewChat,
  onClose,
  walletAddress,
  onRenameChat,
  onArchiveChat,
  onDeleteChat,
}: SidebarProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Header: logo + new chat */}
      <div
        className={cn(
          "flex items-center justify-between shrink-0",
          "px-[var(--space-3)] py-[var(--space-2)]",
          "h-[48px] md:h-[52px]",
        )}
      >
        <div className="relative group/logo flex items-center">
          <MachinesMark size={24} rounded="md" />
          {/* Tooltip — desktop only */}
          <div
            className={cn(
              "absolute left-full top-1/2 -translate-y-1/2 ml-2",
              "px-2 py-1 rounded-[6px]",
              "bg-[var(--gray-800)] text-[11px] text-[var(--agent-text-secondary)]",
              "whitespace-nowrap pointer-events-none",
              "opacity-0 group-hover/logo:opacity-100",
              "transition-opacity duration-[var(--duration-fast)]",
              "shadow-[var(--shadow-sm)]",
              "hidden md:block",
            )}
          >
            open sidebar
          </div>
        </div>

        <div className="flex items-center gap-[var(--space-1)]">
          {/* New chat button */}
          <button
            type="button"
            onClick={onNewChat}
            className={cn(
              "w-[28px] h-[28px] rounded-full",
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
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {/* Close button — mobile only */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "w-[28px] h-[28px] rounded-full",
                "flex items-center justify-center",
                "text-[var(--agent-text-secondary)]",
                "hover:bg-[var(--agent-surface-elevated)]",
                "transition-colors duration-[var(--duration-fast)]",
                "active:scale-[0.92]",
                "md:hidden",
              )}
              aria-label="close sidebar"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Section label */}
      <div className="px-[var(--space-3)] pt-[var(--space-2)] pb-[var(--space-1)]">
        <span className="text-[11px] text-[var(--agent-text-muted)] font-medium tracking-[0.05em]">
          recent
        </span>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-[var(--space-2)]">
        {entries.length === 0 ? (
          <div className="px-[var(--space-2)] py-[var(--space-4)]">
            <p className="text-[13px] text-[var(--agent-text-muted)]">
              no conversations yet
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {entries.map((entry) => (
              <ChatEntryItem
                key={entry.chatSessionId}
                entry={entry}
                isActive={entry.chatSessionId === activeChatSessionId}
                menuOpen={openMenuId === entry.chatSessionId}
                onMenuToggle={(open) =>
                  setOpenMenuId(open ? entry.chatSessionId : null)
                }
                onSelect={() => onSelectChat(entry.chatSessionId)}
                onRename={onRenameChat}
                onArchive={onArchiveChat}
                onDelete={onDeleteChat}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom: wallet address */}
      {walletAddress && (
        <div
          className={cn(
            "shrink-0 px-[var(--space-3)] py-[var(--space-3)]",
            "border-t border-[var(--agent-border)]",
          )}
        >
          <div className="flex items-center gap-[var(--space-2)]">
            <div
              className={cn(
                "w-[24px] h-[24px] rounded-full shrink-0",
                "bg-[var(--agent-surface-elevated)]",
                "flex items-center justify-center",
                "text-[var(--agent-text-muted)]",
              )}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="text-[10px] text-[var(--agent-text-muted)] keep-case break-all leading-tight">
              {walletAddress}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Desktop Sidebar ─── */

export function DesktopSidebar(props: SidebarProps) {
  return (
    <aside
      className={cn(
        "w-[var(--agent-sidebar-width)] shrink-0",
        "bg-[var(--agent-sidebar-bg)]",
        "border-r border-[var(--agent-border)]",
        "h-full",
      )}
    >
      <SidebarContent {...props} />
    </aside>
  );
}

/* ─── Mobile Sidebar Overlay ─── */

export function MobileSidebarOverlay(
  props: SidebarProps & { onClose: () => void },
) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [props.onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node)
      ) {
        props.onClose();
      }
    },
    [props.onClose],
  );

  return (
    <div
      className={cn(
        "fixed inset-0 z-40",
        "bg-black/50",
        "animate-backdrop-in",
      )}
      onClick={handleBackdropClick}
    >
      <div
        ref={sidebarRef}
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50",
          "w-[280px]",
          "bg-[var(--agent-sidebar-bg)]",
          "shadow-[var(--shadow-lg)]",
          "animate-sidebar-in",
        )}
      >
        <SidebarContent {...props} />
      </div>
    </div>
  );
}
