"use client";

import { useMemo, useState } from "react";
import { cn } from "../../lib/utils";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { useWalletDiscovery } from "../../hooks/use-wallet-discovery";
import {
  isShortcutInstalled,
  MOBILE_WALLET_SHORTLIST,
} from "../../lib/wallet-shortlist";
import { WalletMoreSheet } from "./wallet-more-sheet";

type WalletShortcutsProps = {
  disabled?: boolean;
  compact?: boolean;
  onSelectMachines: (source: string) => void;
};

export function WalletShortcuts({
  disabled = false,
  compact = false,
  onSelectMachines,
}: WalletShortcutsProps) {
  const { wallets, status, rescan } = useWalletDiscovery();
  const isMobile = useIsMobile();
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  const shortcutInstallation = useMemo(() => {
    const installed = new Set<string>();
    for (const shortcut of MOBILE_WALLET_SHORTLIST) {
      const hasMatch = wallets.some((wallet) =>
        isShortcutInstalled({
          shortcut,
          walletName: wallet.info.name,
          walletId: wallet.info.walletId ?? null,
          walletRdns: wallet.info.rdns ?? null,
        }),
      );
      if (hasMatch) {
        installed.add(shortcut.id);
      }
    }
    return installed;
  }, [wallets]);

  if (isMobile) {
    return (
      <div className="space-y-[var(--space-2)]">
        <div className="grid grid-cols-3 gap-[var(--space-2)]">
          {MOBILE_WALLET_SHORTLIST.map((shortcut) => (
            <button
              key={shortcut.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectMachines(`wallet_shortcut:${shortcut.id}`)}
              className={cn(
                "relative flex min-h-11 flex-col items-center justify-center rounded-[var(--radius-sm)] border border-[var(--agent-border)] px-[var(--space-2)] py-[var(--space-2)] transition",
                "hover:bg-[var(--agent-surface-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--violet)]",
                disabled && "cursor-not-allowed opacity-50",
                compact ? "text-[var(--text-xs)]" : "text-[var(--text-xs)]",
              )}
              aria-label={`continue with ${shortcut.label}`}
            >
              <span className="text-[var(--text-xs)] font-medium text-[var(--agent-text-primary)]">
                {shortcut.shortLabel}
              </span>
              <span className="mt-[2px] truncate text-[var(--text-xs)] text-[var(--agent-text-secondary)]">
                {shortcut.label}
              </span>
              {shortcutInstallation.has(shortcut.id) && (
                <span className="absolute right-[6px] top-[6px] h-[6px] w-[6px] rounded-full bg-[var(--green)]" />
              )}
            </button>
          ))}

          <button
            type="button"
            disabled={disabled}
            onClick={() => setShowMoreSheet(true)}
            className={cn(
              "flex min-h-11 flex-col items-center justify-center rounded-[var(--radius-sm)] border border-[var(--agent-border)] px-[var(--space-2)] py-[var(--space-2)] transition",
              "hover:bg-[var(--agent-surface-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--violet)]",
              disabled && "cursor-not-allowed opacity-50",
              compact ? "text-[var(--text-xs)]" : "text-[var(--text-xs)]",
            )}
            aria-label="show more wallets"
          >
            <span className="text-[var(--text-xs)] font-medium text-[var(--agent-text-primary)]">+</span>
            <span className="mt-[2px] text-[var(--text-xs)] text-[var(--agent-text-secondary)]">more</span>
          </button>
        </div>

        <WalletMoreSheet
          open={showMoreSheet}
          wallets={wallets}
          loading={status === "discovering"}
          disabled={disabled}
          onClose={() => setShowMoreSheet(false)}
          onRefresh={rescan}
          onSelect={(source) => {
            setShowMoreSheet(false);
            onSelectMachines(source);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-[var(--space-2)]">
      <div className="flex items-center justify-between">
        <p className="text-[var(--text-xs)] uppercase tracking-[0.08em] text-[var(--agent-text-muted)]">
          browser wallets
        </p>
        <button
          type="button"
          onClick={rescan}
          disabled={disabled}
          className="h-9 rounded-[var(--radius-sm)] border border-[var(--agent-border)] px-[var(--space-3)] text-[var(--text-xs)] text-[var(--agent-text-secondary)] transition hover:bg-[var(--agent-surface-elevated)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          refresh
        </button>
      </div>

      {wallets.length > 0 ? (
        <div className="grid gap-[var(--space-2)] sm:grid-cols-2">
          {wallets.map((wallet) => {
            const walletName = wallet.info.name.toLowerCase();
            return (
              <button
                key={wallet.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelectMachines(`wallet_shortcut:${walletName}`)}
                className={cn(
                  "flex min-h-11 items-center gap-[var(--space-3)] rounded-[var(--radius-sm)] border border-[var(--agent-border)] px-[var(--space-3)] py-[10px] text-left transition",
                  "hover:bg-[var(--agent-surface-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--violet)]",
                  disabled && "cursor-not-allowed opacity-50",
                )}
                aria-label={`continue with ${walletName}`}
              >
                {wallet.info.icon ? (
                  <img
                    src={wallet.info.icon}
                    alt={`${walletName} icon`}
                    className="h-7 w-7 rounded-[8px] object-cover"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[var(--agent-surface-elevated)] text-[var(--text-xs)] text-[var(--agent-text-secondary)]">
                    {walletName.slice(0, 2)}
                  </div>
                )}
                <p className="truncate text-[var(--text-sm)] text-[var(--agent-text-primary)]">
                  {walletName}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-[var(--text-xs)] text-[var(--agent-text-muted)]">
          {status === "discovering"
            ? "scanning for wallets..."
            : "no browser wallets detected. continue with machines to open app.machines.cash sign-in."}
        </p>
      )}
    </div>
  );
}
