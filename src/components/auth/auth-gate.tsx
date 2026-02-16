"use client";

import type { AgentAuthState } from "../../hooks/use-agent-auth";
import type { AgentSession } from "@/contracts";
import { AuthLoadingView } from "./auth-loading-view";
import { WalletConnectView } from "./wallet-connect-view";

interface AuthGateProps {
  auth: {
    state: AgentAuthState;
    error: string | null;
    session: AgentSession | null;
    loginWithMachines: (source?: string) => Promise<void>;
    loginWithBankr: (source?: string) => Promise<void>;
    connectFallbackUrl: string | null;
    logout: () => void;
  };
  children: React.ReactNode;
}

export function AuthGate({ auth, children }: AuthGateProps) {
  if (auth.state === "auth_checking") {
    return <AuthLoadingView message="checking session..." />;
  }

  if (
    auth.state === "bridge_in_progress" ||
    auth.state === "connect_in_progress" ||
    auth.state === "bankr_in_progress"
  ) {
    return <AuthLoadingView message="starting secure session..." />;
  }

  if (auth.state === "login_required" || auth.state === "error") {
    return <WalletConnectView auth={auth} />;
  }

  return <>{children}</>;
}
