"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import type { KycFieldErrorMap, KycFormDraft } from "./kyc-flow-v2-utils";
import {
  ACCOUNT_PURPOSE_OPTIONS,
  ANNUAL_SALARY_OPTIONS,
  EXPECTED_VOLUME_OPTIONS,
} from "./kyc-flow-v2-utils";
import { cn } from "../../lib/utils";

type FieldRefCallback = (element: HTMLInputElement | HTMLSelectElement | null) => void;

/* ─── Framer variants ─── */

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
  },
};

/* ─── Reusable components ─── */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[13px] text-[rgba(235,235,245,0.6)] leading-[1.3] mb-[6px]">
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-[12px] text-[#FF7B7B] leading-[1.2] mt-[6px]">
      {message}
    </p>
  );
}

/* ─── OptionTile grid ─── */

function OptionTileGrid({
  options,
  value,
  onChange,
  registerRef,
  columns = 2,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  registerRef?: FieldRefCallback;
  columns?: 2 | 3;
}) {
  const selectedKeyRef = useRef<string | null>(null);

  return (
    <div>
      <select
        ref={registerRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute h-0 w-0 overflow-hidden opacity-0"
        tabIndex={-1}
        aria-hidden="true"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <div
        className={cn(
          "grid gap-[12px]",
          columns === 3 ? "grid-cols-3" : "grid-cols-2",
        )}
      >
        {options.map((opt) => {
          const isSelected = opt.value === value;
          const justSelected = isSelected && selectedKeyRef.current === opt.value;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                selectedKeyRef.current = opt.value;
                onChange(opt.value);
              }}
              className={cn(
                "relative flex h-[44px] items-center justify-center overflow-hidden",
                "rounded-[10px] border-[0.5px] px-[12px]",
                "text-[14px]",
                "transition-all duration-200",
                "active:scale-[0.97]",
                isSelected
                  ? "border-[var(--violet)] text-white"
                  : "border-[rgba(255,255,255,0.08)] text-[rgba(235,235,245,0.6)] hover:border-[rgba(255,255,255,0.15)]",
              )}
              style={
                isSelected
                  ? {
                      background: "rgba(123, 47, 255, 0.12)",
                      boxShadow: "0 0 20px rgba(123, 47, 255, 0.15)",
                    }
                  : { background: "rgba(255, 255, 255, 0.04)" }
              }
            >
              {justSelected && (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.04) 45%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 55%, transparent 70%)",
                    animation: "shimmer-sweep 0.8s ease-out forwards",
                  }}
                />
              )}
              <span className="relative z-[1]">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main export ─── */

export function KycStageAccountUse({
  draft,
  errors,
  onFieldChange,
  registerField,
}: {
  draft: KycFormDraft;
  errors: KycFieldErrorMap;
  onFieldChange: (field: keyof KycFormDraft, value: string) => void;
  registerField: (field: keyof KycFormDraft) => FieldRefCallback;
}) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="pb-[var(--space-12)]"
    >
      {/* ─── Hero heading ─── */}
      <motion.div variants={fadeUp} className="pt-[var(--space-8)] pb-[var(--space-6)]">
        <h1 className="text-[length:var(--display-sm)] font-medium leading-[var(--leading-tight)] tracking-[var(--tracking-tight)] text-[var(--agent-text-primary)]">
          almost there
        </h1>
        <p className="mt-[var(--space-2)] text-[var(--text-base)] text-[var(--agent-text-secondary)]">
          a few questions about how you&apos;ll use your account
        </p>
      </motion.div>

      {/* ─── Annual salary ─── */}
      <motion.div variants={fadeUp}>
        <FieldLabel>annual salary</FieldLabel>
        <OptionTileGrid
          options={ANNUAL_SALARY_OPTIONS}
          value={draft.annualSalary}
          onChange={(v) => onFieldChange("annualSalary", v)}
          registerRef={registerField("annualSalary")}
        />
        <FieldError message={errors.annualSalary} />
      </motion.div>

      {/* ─── Account purpose ─── */}
      <motion.div variants={fadeUp} className="mt-[20px]">
        <FieldLabel>what is this account for?</FieldLabel>
        <OptionTileGrid
          options={ACCOUNT_PURPOSE_OPTIONS}
          value={draft.accountPurpose}
          onChange={(v) => onFieldChange("accountPurpose", v)}
          registerRef={registerField("accountPurpose")}
          columns={3}
        />
        <FieldError message={errors.accountPurpose} />
      </motion.div>

      {/* ─── Expected monthly volume ─── */}
      <motion.div variants={fadeUp} className="mt-[20px]">
        <FieldLabel>expected monthly volume</FieldLabel>
        <OptionTileGrid
          options={EXPECTED_VOLUME_OPTIONS}
          value={draft.expectedMonthlyVolume}
          onChange={(v) => onFieldChange("expectedMonthlyVolume", v)}
          registerRef={registerField("expectedMonthlyVolume")}
        />
        <FieldError message={errors.expectedMonthlyVolume} />
      </motion.div>

      {/* ─── Privacy note ─── */}
      <motion.div variants={fadeUp} className="mt-[20px]">
        <div
          className={cn(
            "rounded-[10px] px-[12px] py-[12px]",
            "bg-[rgba(255,255,255,0.06)]",
            "border-[0.5px] border-[rgba(255,255,255,0.06)]",
          )}
        >
          <p className="text-[12px] leading-[1.4] text-[rgba(235,235,245,0.6)]">
            submitting sends your application. if verification is needed, we&apos;ll
            guide you through the next step.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
