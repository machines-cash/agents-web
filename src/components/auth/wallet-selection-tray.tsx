"use client";

import { AgentTray } from "../ui/agent-tray";
import { WalletShortcuts } from "./wallet-shortcuts";

interface WalletSelectionTrayProps {
  open: boolean;
  onClose: () => void;
  disabled: boolean;
  onSelectMachines: (source: string) => void;
}

export function WalletSelectionTray({
  open,
  onClose,
  disabled,
  onSelectMachines,
}: WalletSelectionTrayProps) {
  return (
    <AgentTray open={open} onClose={onClose} height="auto" showHandle zIndex={70}>
      <div className="px-[var(--space-6)] pt-[var(--space-4)] pb-[var(--space-6)]">
        <div className="mb-[var(--space-4)] flex items-center justify-between">
          <h3 className="text-[var(--text-base)] font-medium keep-case">
            Select a wallet
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-[var(--radius-sm)] border border-[var(--agent-border)] px-[var(--space-3)] text-[var(--text-xs)] text-[var(--agent-text-secondary)] transition hover:bg-[var(--agent-surface-elevated)]"
            aria-label="close wallet selection"
          >
            close
          </button>
        </div>

        <WalletShortcuts
          disabled={disabled}
          onSelectMachines={(source) => {
            onSelectMachines(source);
            onClose();
          }}
        />
      </div>
    </AgentTray>
  );
}
