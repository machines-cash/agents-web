"use client";

import { LoginTray } from "./login-tray";

interface WalletConnectViewProps {
  auth: {
    error: string | null;
    loginWithMachines: (source?: string) => Promise<void>;
    loginWithBankr: (source?: string) => Promise<void>;
    connectFallbackUrl: string | null;
    state: string;
  };
}

export function WalletConnectView({ auth }: WalletConnectViewProps) {
  return (
    <div className="min-h-[calc(var(--agent-vh,1vh)*100)] bg-[var(--agent-bg)]">
      <LoginTray
        open={true}
        onClose={() => {}}
        auth={auth}
        dismissible={false}
        sourcePrefix="gate"
      />
    </div>
  );
}
