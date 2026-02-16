"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MachinesMark, MachinesWordmark } from "../ui/logo";
import { Button } from "../ui/button";
import { Alert } from "../ui/alert";
import { AgentTray } from "../ui/agent-tray";
import { WalletSelectionTray } from "./wallet-selection-tray";
import { cn } from "../../lib/utils";

/* ─── Inline icons ─── */

function BankrIcon({ size = 20 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-[4px] bg-[var(--agent-surface-elevated)] text-[var(--text-xs)] font-medium text-[var(--agent-text-primary)] shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      B
    </span>
  );
}

function WalletIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a1 1 0 0 0 0 4h3v-4z" />
    </svg>
  );
}

/* ─── LoginTray ─── */

interface LoginTrayProps {
  open: boolean;
  onClose: () => void;
  auth: {
    error: string | null;
    loginWithMachines: (source?: string) => Promise<void>;
    loginWithBankr: (source?: string) => Promise<void>;
    connectFallbackUrl: string | null;
    state: string;
  };
  /** If false, the tray cannot be dismissed (used for full auth gate). Default: true */
  dismissible?: boolean;
  /** Source prefix for analytics (e.g., "gate" or "card") */
  sourcePrefix?: string;
}

export function LoginTray({
  open,
  onClose,
  auth,
  dismissible = true,
  sourcePrefix = "gate",
}: LoginTrayProps) {
  const [walletTrayOpen, setWalletTrayOpen] = useState(false);

  const isMachinesBusy =
    auth.state === "connect_in_progress" || auth.state === "bridge_in_progress";
  const isBankrBusy = auth.state === "bankr_in_progress";
  const isBusy = isMachinesBusy || isBankrBusy;

  return (
    <AgentTray
      open={open}
      onClose={onClose}
      height="auto"
      showHandle={dismissible}
      dismissible={dismissible}
    >
      <motion.div
        className="flex flex-col items-center px-[var(--space-8)] py-[var(--space-8)] gap-[var(--space-5)]"
        initial={{ opacity: 0, y: 8, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ─── Wordmark ─── */}
        <MachinesWordmark height={24} color="var(--orange)" />

        {/* ─── Heading ─── */}
        <h2 className="text-[var(--display-sm)] font-medium tracking-[var(--tracking-tight)] keep-case">
          Log in or sign up
        </h2>

        {/* ─── Error ─── */}
        {auth.error && (
          <Alert variant="error" className="w-full">
            {auth.error}
          </Alert>
        )}

        {/* ─── Auth buttons ─── */}
        <div className="flex flex-col gap-[var(--space-3)] w-full">
          <Button
            variant="accent"
            size="lg"
            className="w-full keep-case"
            onClick={() =>
              void auth.loginWithMachines(`${sourcePrefix}_button_machines`)
            }
            loading={isMachinesBusy}
            disabled={isBusy}
            aria-label="continue with machines"
          >
            <MachinesMark size={20} rounded="sm" />
            continue with machines
          </Button>

          <Button
            variant="secondary"
            size="lg"
            className="w-full keep-case border border-[var(--agent-border)]"
            onClick={() =>
              void auth.loginWithBankr(`${sourcePrefix}_button_bankr`)
            }
            loading={isBankrBusy}
            disabled={isBusy}
            aria-label="continue with bankr"
          >
            <BankrIcon size={20} />
            continue with bankr
          </Button>
        </div>

        {/* ─── Fallback ─── */}
        {auth.connectFallbackUrl && (
          <a
            href={auth.connectFallbackUrl}
            className="text-center text-[var(--text-xs)] text-[var(--agent-text-secondary)] hover:text-[var(--agent-text-primary)] transition-colors"
          >
            popup blocked? continue in this tab
          </a>
        )}

        {/* ─── Divider ─── */}
        <div className="flex items-center gap-[var(--space-4)] w-full py-[var(--space-2)]">
          <span className="h-px flex-1 bg-[var(--agent-border-strong)]" />
          <span className="text-[var(--text-xs)] uppercase tracking-[0.14em] text-[var(--agent-text-muted)] select-none">
            or
          </span>
          <span className="h-px flex-1 bg-[var(--agent-border-strong)]" />
        </div>

        {/* ─── Wallet button ─── */}
        <button
          type="button"
          disabled={isBusy}
          onClick={() => setWalletTrayOpen(true)}
          className={cn(
            "flex w-full items-center justify-center gap-[var(--space-2)] h-14 px-[var(--space-8)]",
            "rounded-[var(--radius-sm)] border border-[var(--agent-border)]",
            "text-[var(--text-base)] font-light text-[var(--agent-text-secondary)]",
            "transition-all duration-[var(--duration-fast)]",
            "hover:border-[var(--agent-border-strong)] hover:text-[var(--agent-text-primary)] hover:bg-[var(--agent-surface-elevated)]",
            "active:scale-[0.98] active:opacity-70",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--violet)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--agent-bg)]",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
          aria-label="continue with wallet"
        >
          <WalletIcon size={18} />
          continue with wallet
        </button>

        {/* ─── Wallet selection tray ─── */}
        <WalletSelectionTray
          open={walletTrayOpen}
          onClose={() => setWalletTrayOpen(false)}
          disabled={isBusy}
          onSelectMachines={(source) =>
            void auth.loginWithMachines(`${sourcePrefix}_${source}`)
          }
        />

        {/* ─── Connect your own AI ─── */}
        <Link
          href="/connect"
          className={cn(
            "text-[var(--text-xs)] text-[var(--agent-text-muted)]",
            "transition-colors duration-[var(--duration-fast)]",
            "hover:text-[var(--agent-text-secondary)]",
            "opacity-60 hover:opacity-100",
          )}
        >
          or connect your own ai &rarr;
        </Link>
      </motion.div>
    </AgentTray>
  );
}
