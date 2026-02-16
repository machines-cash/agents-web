"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";

/* ─── Glass surface style ─── */

const glassStyle = {
  background: "rgba(28, 28, 30, 0.72)",
  backdropFilter: "blur(40px) saturate(180%) brightness(105%)",
  WebkitBackdropFilter: "blur(40px) saturate(180%) brightness(105%)",
  boxShadow:
    "inset 0 0.5px 0 0 rgba(255, 255, 255, 0.09), inset 0 1px 20px rgba(255, 255, 255, 0.02), 0 2px 16px rgba(0, 0, 0, 0.3)",
} as const;

/* ─── Shield icon with glow ring ─── */

function ShieldGlowIcon() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Pulsing glow ring */}
      <motion.div
        className="absolute h-[100px] w-[100px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(123,47,255,0.12) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.15, 0.4],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Glass circle */}
      <div
        className="relative flex h-[80px] w-[80px] items-center justify-center rounded-full"
        style={{
          background: "rgba(123, 47, 255, 0.08)",
          boxShadow: "0 0 30px rgba(123, 47, 255, 0.2), inset 0 0.5px 0 0 rgba(255,255,255,0.09)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--violet)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </div>
    </div>
  );
}

/* ─── Main export ─── */

export function KycStageProviderHandoff({
  verificationUrl,
  opening,
  onOpenProvider,
  onCompleted,
  onAskAgent,
}: {
  verificationUrl: string | null;
  opening: boolean;
  onOpenProvider: () => void;
  onCompleted: () => void;
  onAskAgent: () => void;
}) {
  const autoOpenTriggeredRef = useRef(false);

  useEffect(() => {
    if (!verificationUrl || autoOpenTriggeredRef.current) {
      return;
    }
    autoOpenTriggeredRef.current = true;
    const timeout = window.setTimeout(() => {
      onOpenProvider();
    }, 1200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [onOpenProvider, verificationUrl]);

  return (
    <div className="flex flex-col items-center justify-center px-[var(--space-5)] py-[var(--space-16)]">
      {/* ─── Shield icon ─── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <ShieldGlowIcon />
      </motion.div>

      {/* ─── Heading ─── */}
      <motion.h1
        className="mt-[var(--space-8)] text-center text-[length:var(--display-sm)] font-medium leading-[var(--leading-tight)] tracking-[var(--tracking-tight)] text-[var(--agent-text-primary)]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
      >
        verifying your identity
      </motion.h1>

      {/* ─── Privacy card ─── */}
      <motion.div
        className="mt-[var(--space-5)] w-full max-w-[360px]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <div
          className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-sm)] px-[var(--space-4)] py-[var(--space-3)]"
          style={glassStyle}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--agent-text-muted)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-[2px] shrink-0"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p className="text-[var(--text-xs)] leading-relaxed text-[var(--agent-text-muted)]">
            you&apos;ll be redirected to a secure verification provider. machines
            doesn&apos;t see your verification data.
          </p>
        </div>
      </motion.div>

      {/* ─── Action buttons ─── */}
      <motion.div
        className="mt-[var(--space-8)] flex w-full max-w-[360px] flex-col gap-[var(--space-3)]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <Button
          variant="accent"
          size="lg"
          onClick={onOpenProvider}
          disabled={!verificationUrl || opening}
          loading={opening}
          className="min-h-[52px] w-full"
        >
          continue to verification
        </Button>

        <Button
          variant="secondary"
          size="lg"
          onClick={onCompleted}
          className="min-h-[52px] w-full"
        >
          i&apos;ve completed verification
        </Button>

        <button
          type="button"
          onClick={onAskAgent}
          className="py-[var(--space-2)] text-[var(--text-sm)] text-[var(--agent-text-muted)] transition-colors duration-[var(--duration-fast)] hover:text-[var(--agent-text-secondary)]"
        >
          need help?
        </button>
      </motion.div>

      {/* ─── Missing URL warning ─── */}
      {!verificationUrl ? (
        <motion.p
          className="mt-[var(--space-4)] max-w-[320px] text-center text-[var(--text-xs)] text-[#FF453A]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          verification link is not ready yet. tap &quot;i&apos;ve completed
          verification&quot; to refresh, or ask for help.
        </motion.p>
      ) : null}
    </div>
  );
}
