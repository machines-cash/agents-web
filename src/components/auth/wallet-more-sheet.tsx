"use client";

import type { WalletDescriptor } from "../../types/wallets";
import { cn } from "../../lib/utils";
import { AgentTray } from "../ui/agent-tray";

type WalletMoreSheetProps = {
  open: boolean;
  wallets: WalletDescriptor[];
  loading: boolean;
  disabled?: boolean;
  onClose: () => void;
  onSelect: (source: string) => void;
  onRefresh: () => void;
};

function WalletIcon({
  name,
  icon,
}: {
  name: string;
  icon: string | null;
}) {
  if (icon && icon.trim().length > 0) {
    return (
      <img
        src={icon}
        alt={`${name} icon`}
        className="h-8 w-8 rounded-[10px] object-cover"
      />
    );
  }

  const label = name.slice(0, 2);
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--agent-surface-elevated)] text-[var(--text-xs)] font-medium text-[var(--agent-text-secondary)]">
      {label}
    </div>
  );
}

export function WalletMoreSheet({
  open,
  wallets,
  loading,
  disabled = false,
  onClose,
  onSelect,
  onRefresh,
}: WalletMoreSheetProps) {
  return (
    <AgentTray open={open} onClose={onClose} height="auto" showHandle zIndex={80}>
      <div className="px-[var(--space-4)] pt-[var(--space-2)] pb-[var(--space-6)]">
        <div className="mb-[var(--space-4)] flex items-center justify-between">
          <h3 className="text-[var(--text-base)] font-medium keep-case">
            More wallets
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="h-11 min-w-11 rounded-[var(--radius-sm)] border border-[var(--agent-border)] px-[var(--space-3)] text-[var(--text-sm)] text-[var(--agent-text-secondary)] transition hover:bg-[var(--agent-surface-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--violet)]"
            aria-label="close wallet sheet"
          >
            close
          </button>
        </div>

        <div className="space-y-[var(--space-2)]">
          {wallets.map((wallet) => {
            const walletName = wallet.info.name.toLowerCase();
            return (
              <button
                key={wallet.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(`wallet_more:${walletName}`)}
                className={cn(
                  "flex min-h-12 w-full items-center gap-[var(--space-3)] rounded-[var(--radius-sm)] border border-[var(--agent-border)] px-[var(--space-3)] py-[10px] text-left transition",
                  "hover:bg-[var(--agent-surface-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--violet)]",
                  disabled && "cursor-not-allowed opacity-50",
                )}
                aria-label={`continue with ${walletName}`}
              >
                <WalletIcon
                  name={walletName}
                  icon={wallet.info.icon || null}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[var(--text-sm)] text-[var(--agent-text-primary)]">
                    {walletName}
                  </p>
                  <p className="truncate text-[var(--text-xs)] text-[var(--agent-text-muted)]">
                    continue with machines
                  </p>
                </div>
              </button>
            );
          })}

          {wallets.length === 0 && (
            <div className="rounded-[var(--radius-sm)] border border-dashed border-[var(--agent-border)] p-[var(--space-4)]">
              <p className="text-[var(--text-xs)] text-[var(--agent-text-secondary)]">
                {loading
                  ? "scanning browser wallets..."
                  : "no browser wallets detected. continue to open machines sign-in."}
              </p>
              <div className="mt-[var(--space-3)] flex gap-[var(--space-2)]">
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={disabled || loading}
                  className="h-11 rounded-[var(--radius-sm)] border border-[var(--agent-border)] px-[var(--space-3)] text-[var(--text-xs)] text-[var(--agent-text-secondary)] transition hover:bg-[var(--agent-surface-elevated)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  refresh
                </button>
                <button
                  type="button"
                  onClick={() => onSelect("wallet_more:generic")}
                  disabled={disabled}
                  className="h-11 rounded-[var(--radius-sm)] bg-[var(--orange)] px-[var(--space-3)] text-[var(--text-xs)] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  continue with machines
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AgentTray>
  );
}
