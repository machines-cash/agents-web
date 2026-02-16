"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { KycFieldErrorMap, KycFormDraft } from "./kyc-flow-v2-utils";
import { COUNTRY_OPTIONS } from "./kyc-flow-v2-utils";
import { cn } from "../../lib/utils";

type FieldRefCallback = (element: HTMLInputElement | HTMLSelectElement | null) => void;

/* ─── Framer variants ─── */

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
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

/* ─── Main export ─── */

export function KycStageBasic({
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
  const [showPhone, setShowPhone] = useState(
    Boolean(draft.phoneNumber.trim()),
  );

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
          let&apos;s start with the basics
        </h1>
        <p className="mt-[var(--space-2)] text-[var(--text-base)] text-[var(--agent-text-secondary)]">
          your legal name and contact details
        </p>
      </motion.div>

      {/* ─── Personal info group (single container) ─── */}
      <motion.div variants={fadeUp}>
        <FieldGroup>
          <div className="space-y-[12px]">
            {/* Name */}
            <div>
              <FieldLabel>full name</FieldLabel>
              <div className="grid grid-cols-2 gap-[12px]">
                <div>
                  <input
                    ref={registerField("firstName")}
                    value={draft.firstName}
                    onChange={(e) => onFieldChange("firstName", e.target.value)}
                    placeholder="first name"
                    autoComplete="given-name"
                    autoCapitalize="words"
                    autoCorrect="off"
                    enterKeyHint="next"
                    className={cn(kycInputClass, errors.firstName ? kycInputError : kycInputNormal)}
                  />
                  <FieldError message={errors.firstName} />
                </div>
                <div>
                  <input
                    ref={registerField("lastName")}
                    value={draft.lastName}
                    onChange={(e) => onFieldChange("lastName", e.target.value)}
                    placeholder="last name"
                    autoComplete="family-name"
                    autoCapitalize="words"
                    autoCorrect="off"
                    enterKeyHint="next"
                    className={cn(kycInputClass, errors.lastName ? kycInputError : kycInputNormal)}
                  />
                  <FieldError message={errors.lastName} />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <FieldLabel>email</FieldLabel>
              <input
                ref={registerField("email")}
                type="email"
                value={draft.email}
                onChange={(e) => onFieldChange("email", e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="next"
                className={cn(kycInputClass, errors.email ? kycInputError : kycInputNormal)}
              />
              <FieldError message={errors.email} />
            </div>

            {/* Date of birth */}
            <div>
              <FieldLabel>date of birth</FieldLabel>
              <input
                ref={registerField("birthDate")}
                type="date"
                value={draft.birthDate}
                onChange={(e) => onFieldChange("birthDate", e.target.value)}
                autoComplete="bday"
                enterKeyHint="next"
                className={cn(kycInputClass, errors.birthDate ? kycInputError : kycInputNormal)}
              />
              <FieldError message={errors.birthDate} />
            </div>
          </div>
        </FieldGroup>
      </motion.div>

      {/* ─── Document country ─── */}
      <motion.div variants={fadeUp} className="mt-[20px]">
        <FieldLabel>document country</FieldLabel>
        <CountryPillSelect
          value={draft.countryOfIssue}
          onChange={(v) => onFieldChange("countryOfIssue", v)}
          registerRef={registerField("countryOfIssue")}
        />
        <FieldError message={errors.countryOfIssue} />
      </motion.div>

      {/* ─── Phone (collapsible) ─── */}
      <motion.div variants={fadeUp} className="mt-[20px]">
        {!showPhone ? (
          <button
            type="button"
            onClick={() => setShowPhone(true)}
            className="text-[14px] text-[var(--violet)] transition-opacity duration-100 hover:opacity-80"
          >
            + add phone number (optional)
          </button>
        ) : (
          <>
            <FieldLabel>phone (optional)</FieldLabel>
            <FieldGroup>
              <div className="grid grid-cols-[100px_1fr] gap-[12px]">
                <input
                  ref={registerField("phoneCountryCode")}
                  type="tel"
                  inputMode="numeric"
                  value={draft.phoneCountryCode}
                  onChange={(e) => onFieldChange("phoneCountryCode", e.target.value)}
                  placeholder="+1"
                  autoComplete="tel-country-code"
                  autoCapitalize="none"
                  enterKeyHint="next"
                  className={cn(kycInputClass, kycInputNormal)}
                />
                <div>
                  <input
                    ref={registerField("phoneNumber")}
                    type="tel"
                    inputMode="numeric"
                    value={draft.phoneNumber}
                    onChange={(e) => onFieldChange("phoneNumber", e.target.value)}
                    placeholder="phone number"
                    autoComplete="tel"
                    autoCapitalize="none"
                    enterKeyHint="done"
                    className={cn(kycInputClass, errors.phoneNumber ? kycInputError : kycInputNormal)}
                  />
                  <FieldError message={errors.phoneNumber} />
                </div>
              </div>
            </FieldGroup>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
