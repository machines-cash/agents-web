"use client";

import { MachinesMark } from "../ui/logo";
import { Spinner } from "../ui/spinner";

export function AuthLoadingView({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(var(--agent-vh,1vh)*100)] gap-[var(--space-6)] animate-fade-in">
      <MachinesMark size={48} />
      <Spinner size="md" className="text-[var(--agent-text-secondary)]" />
      <p className="text-[var(--text-sm)] text-[var(--agent-text-secondary)]">
        {message}
      </p>
    </div>
  );
}
