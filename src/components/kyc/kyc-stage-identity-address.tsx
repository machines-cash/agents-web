"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import type { KycFieldErrorMap, KycFormDraft } from "./kyc-flow-v2-utils";
import {
  COUNTRY_OPTIONS,
  OCCUPATION_OPTIONS,
  requiresNationalId,
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

/* ─── Input classes (matches billing-edit-sub-tray) ─── */

const kycInputClass = cn(
  "w-full h-[44px] rounded-[10px] px-[12px]",
  "text-[14px] text-white placeholder:text-[rgba(235,235,245,0.28)]",
  "bg-[rgba(255,255,255,0.06)] border-[0.5px]",
  "focus:outline-none transition-colors duration-100",
);

const kycInputNormal =
  "border-[rgba(255,255,255,0.09)] focus:border-[rgba(255,255,255,0.22)]";
const kycInputError =
  "border-[#FF4444] focus:border-[#FF4444]";

/* Address inner inputs — borderless rows inside grouped card */
const addressInputClass = cn(
  "w-full h-[44px] bg-transparent border-0 rounded-none px-0",
  "text-[14px] text-white placeholder:text-[rgba(235,235,245,0.28)]",
  "focus:outline-none focus:bg-[rgba(255,255,255,0.03)]",
  "transition-colors duration-100",
);

/* ─── Reusable components ─── */

function FieldGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "w-full rounded-[14px] p-[12px]",
        "bg-[rgba(255,255,255,0.06)]",
        "border-[0.5px] border-[rgba(255,255,255,0.06)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

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

/* ─── OptionTile grid for occupation ─── */

function OptionTileGrid({
  options,
  value,
  onChange,
  registerRef,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  registerRef?: FieldRefCallback;
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

      <div className="grid grid-cols-2 gap-[12px]">
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

/* ─── Country pill select (US/CA only) ─── */

const DISPLAY_COUNTRIES = COUNTRY_OPTIONS.filter(
  (c) => c.value === "US" || c.value === "CA",
);

const FLAG_MAP: Record<string, string> = { US: "\u{1F1FA}\u{1F1F8}", CA: "\u{1F1E8}\u{1F1E6}" };

function CountryPillSelect({
  value,
  onChange,
  registerRef,
}: {
  value: string;
  onChange: (value: string) => void;
  registerRef?: FieldRefCallback;
}) {
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
        {COUNTRY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-[12px]">
        {DISPLAY_COUNTRIES.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "relative flex h-[44px] items-center justify-center gap-[8px] overflow-hidden",
                "rounded-[10px] border-[0.5px]",
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
              {isSelected && (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.04) 45%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 55%, transparent 70%)",
                    animation: "shimmer-sweep 0.8s ease-out forwards",
                  }}
                />
              )}
              <span className="text-base">{FLAG_MAP[opt.value] ?? ""}</span>
              <span className="relative z-[1]">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Divider ─── */

function Divider() {
  return <div className="h-px bg-[rgba(255,255,255,0.06)]" />;
}

/* ─── Main export ─── */

export function KycStageIdentityAddress({
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
  const needsNationalId = requiresNationalId(draft.countryOfIssue);

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
          identity & address
        </h1>
        <p className="mt-[var(--space-2)] text-[var(--text-base)] text-[var(--agent-text-secondary)]">
          required for regulatory compliance
        </p>
      </motion.div>

      {/* ─── SSN/SIN (conditional) ─── */}
      {needsNationalId ? (
        <motion.div variants={fadeUp}>
          <FieldLabel>
            {draft.countryOfIssue === "CA" ? "sin" : "ssn"}
          </FieldLabel>
          <FieldGroup>
            <input
              ref={registerField("nationalId")}
              value={draft.nationalId}
              onChange={(e) => onFieldChange("nationalId", e.target.value)}
              placeholder={draft.countryOfIssue === "CA" ? "social insurance number" : "social security number"}
              inputMode="numeric"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="next"
              className={cn(kycInputClass, errors.nationalId ? kycInputError : kycInputNormal)}
            />
            <FieldError message={errors.nationalId} />
          </FieldGroup>
        </motion.div>
      ) : null}

      {/* ─── Occupation ─── */}
      <motion.div
        variants={fadeUp}
        className={cn(needsNationalId ? "mt-[20px]" : "")}
      >
        <FieldLabel>occupation</FieldLabel>
        <OptionTileGrid
          options={OCCUPATION_OPTIONS}
          value={draft.occupation}
          onChange={(v) => onFieldChange("occupation", v)}
          registerRef={registerField("occupation")}
        />
        <FieldError message={errors.occupation} />
      </motion.div>

      {/* ─── Address (grouped card) ─── */}
      <motion.div variants={fadeUp} className="mt-[20px]">
        <FieldLabel>address</FieldLabel>
        <FieldGroup className="p-0">
          <div className="px-[12px]">
            {/* Street */}
            <div className="py-[4px]">
              <input
                ref={registerField("addressLine1")}
                value={draft.addressLine1}
                onChange={(e) => onFieldChange("addressLine1", e.target.value)}
                placeholder="street address"
                autoComplete="address-line1"
                autoCapitalize="words"
                enterKeyHint="next"
                className={addressInputClass}
              />
              <FieldError message={errors.addressLine1} />
            </div>

            <Divider />

            {/* Apt/Suite */}
            <div className="py-[4px]">
              <input
                ref={registerField("addressLine2")}
                value={draft.addressLine2}
                onChange={(e) => onFieldChange("addressLine2", e.target.value)}
                placeholder="apt, suite (optional)"
                autoComplete="address-line2"
                autoCapitalize="words"
                enterKeyHint="next"
                className={addressInputClass}
              />
            </div>

            <Divider />

            {/* City + Region */}
            <div className="grid grid-cols-2">
              <div className="border-r border-[rgba(255,255,255,0.06)] py-[4px] pr-[12px]">
                <input
                  ref={registerField("addressCity")}
                  value={draft.addressCity}
                  onChange={(e) => onFieldChange("addressCity", e.target.value)}
                  placeholder="city"
                  autoComplete="address-level2"
                  autoCapitalize="words"
                  enterKeyHint="next"
                  className={addressInputClass}
                />
                <FieldError message={errors.addressCity} />
              </div>
              <div className="py-[4px] pl-[12px]">
                <input
                  ref={registerField("addressRegion")}
                  value={draft.addressRegion}
                  onChange={(e) => onFieldChange("addressRegion", e.target.value)}
                  placeholder="state / region"
                  autoComplete="address-level1"
                  autoCapitalize="words"
                  enterKeyHint="next"
                  className={addressInputClass}
                />
                <FieldError message={errors.addressRegion} />
              </div>
            </div>

            <Divider />

            {/* Postal + Country */}
            <div className="grid grid-cols-2 items-center">
              <div className="border-r border-[rgba(255,255,255,0.06)] py-[4px] pr-[12px]">
                <input
                  ref={registerField("addressPostalCode")}
                  value={draft.addressPostalCode}
                  onChange={(e) => onFieldChange("addressPostalCode", e.target.value)}
                  placeholder="postal code"
                  inputMode={draft.addressCountryCode === "US" ? "numeric" : "text"}
                  autoComplete="postal-code"
                  autoCapitalize="characters"
                  enterKeyHint="next"
                  className={addressInputClass}
                />
                <FieldError message={errors.addressPostalCode} />
              </div>
              <div className="py-[8px] pl-[12px]">
                <CountryPillSelect
                  value={draft.addressCountryCode}
                  onChange={(v) => onFieldChange("addressCountryCode", v)}
                  registerRef={registerField("addressCountryCode")}
                />
                <FieldError message={errors.addressCountryCode} />
              </div>
            </div>
          </div>
        </FieldGroup>
      </motion.div>
    </motion.div>
  );
}
