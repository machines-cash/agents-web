"use client";

import { useState } from "react";
import { MachinesMark } from "../ui/logo";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { LoginTray } from "../auth/login-tray";

interface WalletConnectCardProps {
  auth: {
    error: string | null;
    loginWithMachines: (source?: string) => Promise<void>;
    loginWithBankr: (source?: string) => Promise<void>;
    connectFallbackUrl: string | null;
    state: string;
  };
}

export function WalletConnectCard({ auth }: WalletConnectCardProps) {
  const [showLoginTray, setShowLoginTray] = useState(false);

  return (
    <>
      <div className="px-[var(--space-4)] md:px-[var(--space-6)] animate-message-enter">
        <div
          className={cn(
            "w-full max-w-[460px]",
            "rounded-[20px]",
            "backdrop-blur-[20px] bg-[var(--agent-glass-bg)]",
            "border border-[var(--agent-glass-border)]",
            "p-[var(--space-4)]",
            "flex items-center gap-[var(--space-3)]",
          )}
        >
          <MachinesMark size={28} />
          <span className="flex-1 text-[var(--text-sm)] text-[var(--agent-text-primary)] font-light keep-case">
            Log in to continue
          </span>
          <Button
            variant="accent"
            size="sm"
            className="keep-case shrink-0"
            onClick={() => setShowLoginTray(true)}
            aria-label="log in"
          >
            log in
          </Button>
        </div>
      </div>

      <LoginTray
        open={showLoginTray}
        onClose={() => setShowLoginTray(false)}
        auth={auth}
        dismissible={true}
        sourcePrefix="card"
      />
    </>
  );
}
