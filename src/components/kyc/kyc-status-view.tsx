"use client";

import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { normalizeKycStatus } from "./kyc-flow-v2-utils";

type KycStatusViewMode = "review" | "agreements" | "terminal" | "complete";

/* ─── Glass surface style ─── */

const glassStyle = {
  background: "rgba(28, 28, 30, 0.72)",
  backdropFilter: "blur(40px) saturate(180%) brightness(105%)",
  WebkitBackdropFilter: "blur(40px) saturate(180%) brightness(105%)",
  boxShadow:
    "inset 0 0.5px 0 0 rgba(255, 255, 255, 0.09), inset 0 1px 20px rgba(255, 255, 255, 0.02), 0 2px 16px rgba(0, 0, 0, 0.3)",
} as const;

function isManualReview(status: string) {
  return normalizeKycStatus(status) === "manual_review";
}

/* ─── Status icons with glass halos ─── */

function ReviewIcon() {
  return (
    <div
      className="flex h-[80px] w-[80px] items-center justify-center rounded-full"
      style={{
        background: "rgba(123, 47, 255, 0.08)",
        boxShadow: "0 0 30px rgba(123, 47, 255, 0.15), inset 0 0.5px 0 0 rgba(255,255,255,0.09)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <Spinner size="lg" className="text-[var(--violet)]" />
    </div>
  );
}

function AgreementsIcon() {
  return (
    <div
      className="flex h-[80px] w-[80px] items-center justify-center rounded-full"
      style={{
        background: "rgba(123, 47, 255, 0.08)",
        boxShadow: "0 0 30px rgba(123, 47, 255, 0.15), inset 0 0.5px 0 0 rgba(255,255,255,0.09)",
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
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    </div>
  );
}

function SuccessIcon() {
  return (
    <div
      className="flex h-[80px] w-[80px] items-center justify-center rounded-full"
      style={{
        background: "rgba(48, 209, 88, 0.08)",
        boxShadow: "0 0 30px rgba(48, 209, 88, 0.15), inset 0 0.5px 0 0 rgba(255,255,255,0.09)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#30D158"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" className="animate-draw-check" />
      </svg>
    </div>
  );
}

function WarningIcon() {
  return (
    <div
      className="flex h-[80px] w-[80px] items-center justify-center rounded-full"
      style={{
        background: "rgba(255, 69, 58, 0.08)",
        boxShadow: "0 0 30px rgba(255, 69, 58, 0.15), inset 0 0.5px 0 0 rgba(255,255,255,0.09)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#FF453A"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </div>
  );
}

/* ─── Content helpers ─── */

function getHeading(mode: KycStatusViewMode, status: string): string {
  if (mode === "review") {
    return isManualReview(status)
      ? "manual review in progress"
      : "we're reviewing your details";
  }
  if (mode === "agreements") return "you're approved";
  if (mode === "complete") return "you're all set";
  const normalized = normalizeKycStatus(status);
  return normalized === "locked" ? "account locked" : "verification needs support";
}

function getSubtitle(
  mode: KycStatusViewMode,
  reason: string | null | undefined,
): string {
  if (mode === "review") {
    return "this page refreshes automatically. we'll have an update shortly.";
  }
  if (mode === "agreements") {
    return "one last step: accept the card agreements to unlock your account.";
  }
  if (mode === "complete") {
    return "everything looks good. preparing your chat experience now.";
  }
  return (
    reason?.trim() ||
    "this status requires support review before you can continue."
  );
}

function getHeadingColor(mode: KycStatusViewMode): string {
  if (mode === "complete") return "#30D158";
  if (mode === "terminal") return "#FF453A";
  return "var(--agent-text-primary)";
}

/* ─── Component ─── */

export function KycStatusView({
  status,
  reason,
  mode,
  refreshing,
  accepting,
  onRefresh,
  onAcceptAgreements,
  onAskAgent,
}: {
  status: string;
  reason?: string | null;
  mode: KycStatusViewMode;
  refreshing: boolean;
  accepting: boolean;
  onRefresh: () => void;
  onAcceptAgreements: () => void;
  onAskAgent: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-[var(--space-5)] py-[var(--space-16)]">
      {/* ─── Icon ─── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 25 }}
      >
        {mode === "review" ? <ReviewIcon /> : null}
        {mode === "agreements" ? <AgreementsIcon /> : null}
        {mode === "complete" ? <SuccessIcon /> : null}
        {mode === "terminal" ? <WarningIcon /> : null}
      </motion.div>

      {/* ─── Heading ─── */}
      <motion.h1
        className="mt-[var(--space-6)] max-w-[340px] text-center text-[length:var(--display-sm)] font-medium leading-[var(--leading-tight)] tracking-[var(--tracking-tight)]"
        style={{ color: getHeadingColor(mode) }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
      >
        {getHeading(mode, status)}
      </motion.h1>

      {/* ─── Subtitle in glass card ─── */}
      <motion.div
        className="mt-[var(--space-4)] w-full max-w-[360px]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <div
          className="rounded-[var(--radius-sm)] px-[var(--space-4)] py-[var(--space-3)]"
          style={glassStyle}
        >
          <p className="text-center text-[var(--text-sm)] leading-relaxed text-[var(--agent-text-secondary)]">
            {getSubtitle(mode, reason)}
          </p>
        </div>
      </motion.div>

      {/* ─── Actions ─── */}
      <motion.div
        className="mt-[var(--space-8)] flex w-full max-w-[360px] flex-col gap-[var(--space-3)]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
      >
        {mode === "review" ? (
          <>
            <Button
              variant="secondary"
              size="lg"
              onClick={onRefresh}
              loading={refreshing}
              disabled={refreshing}
              className="min-h-[52px] w-full"
            >
              refresh status
            </Button>
            <button
              type="button"
              onClick={onAskAgent}
              className="py-[var(--space-2)] text-[var(--text-sm)] text-[var(--agent-text-muted)] transition-colors duration-[var(--duration-fast)] hover:text-[var(--agent-text-secondary)]"
            >
              need help?
            </button>
          </>
        ) : null}

        {mode === "agreements" ? (
          <>
            <Button
              variant="accent"
              size="lg"
              onClick={onAcceptAgreements}
              loading={accepting}
              disabled={accepting}
              className="min-h-[52px] w-full"
            >
              accept agreements
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={onRefresh}
              className="min-h-[52px] w-full"
            >
              refresh status
            </Button>
          </>
        ) : null}

        {mode === "terminal" ? (
          <>
            <Button
              variant="accent"
              size="lg"
              onClick={onAskAgent}
              className="min-h-[52px] w-full"
            >
              ask agent for support
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={onRefresh}
              loading={refreshing}
              disabled={refreshing}
              className="min-h-[52px] w-full"
            >
              refresh status
            </Button>
          </>
        ) : null}
      </motion.div>
    </div>
  );
}
