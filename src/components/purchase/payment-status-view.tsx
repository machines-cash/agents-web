"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  AgentPendingAction,
  AgentPurchaseProgressStep,
} from "@/contracts";
import { cn } from "../../lib/utils";
import { Spinner } from "../ui/spinner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

/* ─── Types ─── */

interface PaymentStatusViewProps {
  action: AgentPendingAction;
  onMinimize: () => void;
  onSubmitThreeDs: (code: string) => void;
  isBusy: boolean;
}

/* ─── iOS-style step icons ─── */

function StepCompletedIcon() {
  return (
    <div className="w-[20px] h-[20px] rounded-full bg-[#30D158] flex items-center justify-center">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
}

function StepActiveIcon() {
  return (
    <div className="w-[20px] h-[20px] rounded-full bg-[var(--orange)] flex items-center justify-center animate-step-pulse">
      <div className="w-[6px] h-[6px] rounded-full bg-white" />
    </div>
  );
}

function StepFailedIcon() {
  return (
    <div className="w-[20px] h-[20px] rounded-full bg-[#FF453A] flex items-center justify-center">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </div>
  );
}

function StepPendingIcon() {
  return (
    <div className="w-[20px] h-[20px] rounded-full border-[1.5px] border-[rgba(235,235,245,0.18)]" />
  );
}

function StepIcon({ state }: { state: string }) {
  if (state === "completed") return <StepCompletedIcon />;
  if (state === "active") return <StepActiveIcon />;
  if (state === "failed") return <StepFailedIcon />;
  return <StepPendingIcon />;
}

/* ─── Hero status icon ─── */

function StatusHeroIcon({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <div className="w-[56px] h-[56px] rounded-full bg-[rgba(48,209,88,0.12)] flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" className="animate-draw-check" />
        </svg>
      </div>
    );
  }
  if (status === "failed" || status === "expired") {
    return (
      <div className="w-[56px] h-[56px] rounded-full bg-[rgba(255,69,58,0.12)] flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF453A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" className="animate-draw-x" />
          <line x1="6" y1="6" x2="18" y2="18" className="animate-draw-x" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-[56px] h-[56px] flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

/* ─── Status label ─── */

function statusLabel(status: string): string {
  if (status === "processing" || status === "confirmed") return "purchase in progress";
  if (status === "awaiting_3ds") return "action needed";
  if (status === "completed") return "purchase confirmed";
  if (status === "failed") return "purchase failed";
  if (status === "expired") return "purchase expired";
  return "processing";
}

/* ─── Step row ─── */

function StepRow({ step }: { step: AgentPurchaseProgressStep }) {
  return (
    <div className="flex items-center gap-[12px]">
      <div className="shrink-0">
        <StepIcon state={step.state} />
      </div>
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            "text-[15px] leading-[1.35]",
            step.state === "active" && "text-white animate-thinking",
            step.state === "completed" && "text-[rgba(235,235,245,0.6)]",
            step.state === "failed" && "text-[#FF453A]",
            step.state === "pending" && "text-[rgba(235,235,245,0.3)]",
          )}
        >
          {step.label}
        </span>
        {step.detail && (
          <div className="text-[13px] text-[rgba(235,235,245,0.3)] mt-[1px]">
            {step.detail}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Component ─── */

export function PaymentStatusView({
  action,
  onMinimize,
  onSubmitThreeDs,
  isBusy,
}: PaymentStatusViewProps) {
  const [threeDsCode, setThreeDsCode] = useState("");
  const [threeDsError, setThreeDsError] = useState<string | null>(null);

  const progress = action.progress;
  const isAwaitingThreeDs = action.status === "awaiting_3ds";
  const isTerminal = ["completed", "failed", "expired"].includes(action.status);

  const handleThreeDsSubmit = () => {
    const normalized = threeDsCode.trim();
    if (!normalized) {
      setThreeDsError("enter your 3ds code");
      return;
    }
    setThreeDsError(null);
    onSubmitThreeDs(normalized);
  };

  return (
    <div className="flex flex-col items-center px-[16px] pb-[20px]">

      {/* ─── Hero icon ─── */}
      <div className="mb-[16px]">
        <StatusHeroIcon status={action.status} />
      </div>

      {/* ─── Status label ─── */}
      <span
        className={cn(
          "text-[17px] font-medium mb-[20px]",
          action.status === "completed" && "text-[#30D158]",
          action.status === "failed" && "text-[#FF453A]",
          action.status === "expired" && "text-[#FF453A]",
          !isTerminal && "text-white",
        )}
      >
        {statusLabel(action.status)}
      </span>

      {/* ─── Progress steps — in a raised capsule like the card row ─── */}
      {progress && progress.steps.length > 0 && (
        <div
          className={cn(
            "w-full rounded-[14px] p-[16px]",
            "bg-[rgba(255,255,255,0.06)]",
            "border-[0.5px] border-[rgba(255,255,255,0.06)]",
            "flex flex-col gap-[14px]",
            "mb-[16px]",
          )}
        >
          {progress.steps.map((step) => (
            <StepRow key={step.id} step={step} />
          ))}
        </div>
      )}

      {/* ─── Detail message ─── */}
      {action.message && !isTerminal && (
        <div className="text-[13px] text-[rgba(235,235,245,0.4)] text-center mb-[16px] animate-thinking">
          {action.message}
        </div>
      )}

      {/* ─── Terminal message ─── */}
      {isTerminal && action.message && (
        <div
          className={cn(
            "text-[13px] text-center mb-[16px]",
            action.status === "completed" ? "text-[#30D158]" : "text-[rgba(235,235,245,0.4)]",
          )}
        >
          {action.message}
        </div>
      )}

      {/* ─── 3DS verification ─── */}
      <AnimatePresence>
        {isAwaitingThreeDs && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "w-full rounded-[14px] p-[16px]",
              "bg-[rgba(255,255,255,0.06)]",
              "border-[0.5px] border-[rgba(255,255,255,0.06)]",
              "flex flex-col gap-[12px]",
              "mb-[16px]",
            )}
          >
            <div>
              <div className="text-[15px] font-medium text-white">
                3ds verification required
              </div>
              <div className="text-[13px] text-[rgba(235,235,245,0.6)] mt-[2px]">
                enter the code sent to your device
              </div>
            </div>
            <div className="flex gap-[8px]">
              <Input
                value={threeDsCode}
                onChange={(event) => setThreeDsCode(event.target.value)}
                placeholder="enter code"
                autoComplete="one-time-code"
                inputMode="numeric"
                error={Boolean(threeDsError)}
              />
              <Button
                variant="accent"
                size="md"
                onClick={handleThreeDsSubmit}
                loading={isBusy}
                disabled={isBusy}
              >
                submit
              </Button>
            </div>
            {threeDsError && (
              <div className="text-[12px] text-[#FF453A]">
                {threeDsError}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Stop button ─── */}
      {!isTerminal && (
        <button
          type="button"
          onClick={onMinimize}
          className={cn(
            "w-full h-[44px] rounded-[12px]",
            "bg-[rgba(255,255,255,0.06)]",
            "border-[0.5px] border-[rgba(255,255,255,0.06)]",
            "text-[15px] text-[rgba(235,235,245,0.6)]",
            "transition-all duration-100",
            "hover:bg-[rgba(255,255,255,0.08)]",
            "active:scale-[0.98]",
          )}
        >
          {isAwaitingThreeDs ? "minimize" : "stop purchase"}
        </button>
      )}
    </div>
  );
}
