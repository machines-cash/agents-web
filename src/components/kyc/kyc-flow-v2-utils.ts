"use client";

import type { AgentKycApplicationPayload, AgentKycStatusResponse } from "@/contracts";

export type KycFormStage = "part_1" | "part_2" | "part_3";

export type KycFieldErrorMap = Record<string, string>;

export type KycFormField = keyof KycFormDraft;

export type KycFlowStatusStage =
  | "form"
  | "provider_handoff"
  | "review"
  | "agreements"
  | "complete"
  | "terminal";

export type KycFormDraft = {
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  countryOfIssue: string;
  nationalId: string;
  occupation: string;
  annualSalary: string;
  accountPurpose: string;
  expectedMonthlyVolume: string;
  addressLine1: string;
  addressLine2: string;
  addressCity: string;
  addressRegion: string;
  addressPostalCode: string;
  addressCountryCode: string;
  phoneCountryCode: string;
  phoneNumber: string;
};

export type KycDraftSnapshot = {
  draft: KycFormDraft;
  stage: KycFormStage;
  savedAt: string;
};

export const COUNTRY_OPTIONS = [
  { value: "US", label: "united states" },
  { value: "CA", label: "canada" },
  { value: "GB", label: "united kingdom" },
  { value: "TR", label: "turkey" },
  { value: "DE", label: "germany" },
  { value: "FR", label: "france" },
  { value: "NL", label: "netherlands" },
  { value: "AE", label: "united arab emirates" },
  { value: "SG", label: "singapore" },
];

export const OCCUPATION_OPTIONS = [
  { value: "15-1132", label: "software developer" },
  { value: "13-2051", label: "financial analyst" },
  { value: "11-1021", label: "operations manager" },
  { value: "SELFEMP", label: "self-employed" },
  { value: "UNEMPLO", label: "unemployed" },
  { value: "OTHERXX", label: "other" },
];

export const ANNUAL_SALARY_OPTIONS = [
  { value: "<40k", label: "under $40k" },
  { value: "50k–99k", label: "$50k-$99k" },
  { value: "100k–149k", label: "$100k-$149k" },
  { value: "150k+", label: "$150k+" },
];

export const ACCOUNT_PURPOSE_OPTIONS = [
  { value: "everyday spend", label: "everyday spend" },
  { value: "subscriptions", label: "subscriptions" },
  { value: "business expenses", label: "business expenses" },
  { value: "testing", label: "testing" },
  { value: "other", label: "other" },
];

export const EXPECTED_VOLUME_OPTIONS = [
  { value: "under $1k", label: "under $1k" },
  { value: "$1k–$5k", label: "$1k-$5k" },
  { value: "$5k–$20k", label: "$5k-$20k" },
  { value: "$20k+", label: "$20k+" },
];

export const EMPTY_KYC_DRAFT: KycFormDraft = {
  firstName: "",
  lastName: "",
  email: "",
  birthDate: "",
  countryOfIssue: "US",
  nationalId: "",
  occupation: "15-1132",
  annualSalary: "50k–99k",
  accountPurpose: "everyday spend",
  expectedMonthlyVolume: "$1k–$5k",
  addressLine1: "",
  addressLine2: "",
  addressCity: "",
  addressRegion: "",
  addressPostalCode: "",
  addressCountryCode: "US",
  phoneCountryCode: "1",
  phoneNumber: "",
};

export const PART_1_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "birthDate",
  "countryOfIssue",
  "phoneCountryCode",
  "phoneNumber",
] as const;

export const PART_2_FIELDS = [
  "nationalId",
  "occupation",
  "addressLine1",
  "addressCity",
  "addressRegion",
  "addressPostalCode",
  "addressCountryCode",
] as const;

export const PART_3_FIELDS = [
  "annualSalary",
  "accountPurpose",
  "expectedMonthlyVolume",
] as const;

export function normalizeKycStatus(status?: string | null) {
  return (status ?? "").toLowerCase().replace(/[\s-]/g, "_");
}

export function requiresNationalId(countryCode: string) {
  const normalized = countryCode.trim().toUpperCase();
  return normalized === "US" || normalized === "CA";
}

export function formatStatusLabel(status?: string | null) {
  const normalized = normalizeKycStatus(status);
  if (!normalized) return "not started";
  return normalized.replace(/_/g, " ");
}

export function isChatUnlocked(status: AgentKycStatusResponse | null) {
  if (!status) return false;
  return (
    normalizeKycStatus(status.status) === "approved" &&
    Boolean(status.isTermsOfServiceAccepted)
  );
}

export function getVerificationLink(status: AgentKycStatusResponse | null) {
  if (!status) return null;
  return status.externalVerificationLink?.url ?? status.completionLink?.url ?? null;
}

export function classifyKycFlowStage(status: AgentKycStatusResponse | null): KycFlowStatusStage {
  const normalizedStatus = normalizeKycStatus(status?.status);
  if (!normalizedStatus || normalizedStatus === "not_submitted") {
    return "form";
  }
  if (
    normalizedStatus === "needs_information" ||
    normalizedStatus === "needs_verification"
  ) {
    return "provider_handoff";
  }
  if (normalizedStatus === "pending" || normalizedStatus === "manual_review") {
    return "review";
  }
  if (normalizedStatus === "approved" && !status?.isTermsOfServiceAccepted) {
    return "agreements";
  }
  if (normalizedStatus === "approved" && status?.isTermsOfServiceAccepted) {
    return "complete";
  }
  if (
    normalizedStatus === "denied" ||
    normalizedStatus === "locked" ||
    normalizedStatus === "canceled"
  ) {
    return "terminal";
  }
  return "form";
}

function hasValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function hasValidDate(value: string) {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return false;
  }
  const parsed = new Date(trimmed);
  return Number.isFinite(parsed.getTime());
}

function hasValidPhone(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  return digits.length >= 6;
}

function hasValidNationalId(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  return digits.length >= 8;
}

export function validatePart1(draft: KycFormDraft) {
  const errors: KycFieldErrorMap = {};
  if (!draft.firstName.trim()) {
    errors.firstName = "enter your legal first name.";
  }
  if (!draft.lastName.trim()) {
    errors.lastName = "enter your legal last name.";
  }
  if (!draft.email.trim()) {
    errors.email = "enter your email.";
  } else if (!hasValidEmail(draft.email)) {
    errors.email = "enter a valid email.";
  }
  if (!draft.birthDate.trim()) {
    errors.birthDate = "enter your date of birth.";
  } else if (!hasValidDate(draft.birthDate)) {
    errors.birthDate = "enter a valid birth date.";
  }
  if (!draft.countryOfIssue.trim()) {
    errors.countryOfIssue = "select your document country.";
  }
  if (draft.phoneNumber.trim() && !hasValidPhone(draft.phoneNumber)) {
    errors.phoneNumber = "enter a valid phone number.";
  }
  return errors;
}

export function validatePart2(draft: KycFormDraft) {
  const errors: KycFieldErrorMap = {};
  if (requiresNationalId(draft.countryOfIssue)) {
    if (!draft.nationalId.trim()) {
      errors.nationalId = "enter your ssn/sin.";
    } else if (!hasValidNationalId(draft.nationalId)) {
      errors.nationalId = "enter a valid ssn/sin.";
    }
  }
  if (!draft.occupation.trim()) {
    errors.occupation = "select your occupation.";
  }
  if (!draft.addressLine1.trim()) {
    errors.addressLine1 = "enter address line 1.";
  }
  if (!draft.addressCity.trim()) {
    errors.addressCity = "enter your city.";
  }
  if (!draft.addressRegion.trim()) {
    errors.addressRegion = "enter your state or region.";
  }
  if (!draft.addressPostalCode.trim()) {
    errors.addressPostalCode = "enter your postal code.";
  }
  if (!draft.addressCountryCode.trim()) {
    errors.addressCountryCode = "select your country.";
  }
  return errors;
}

export function validatePart3(draft: KycFormDraft) {
  const errors: KycFieldErrorMap = {};
  if (!draft.annualSalary.trim()) {
    errors.annualSalary = "select annual salary.";
  }
  if (!draft.accountPurpose.trim()) {
    errors.accountPurpose = "select account purpose.";
  }
  if (!draft.expectedMonthlyVolume.trim()) {
    errors.expectedMonthlyVolume = "select expected monthly volume.";
  }
  return errors;
}

export function buildApplicationPayload(draft: KycFormDraft): AgentKycApplicationPayload {
  const nationalId = draft.nationalId.trim();
  const phoneCountryCode = draft.phoneCountryCode.trim();
  const phoneNumber = draft.phoneNumber.trim();

  return {
    firstName: draft.firstName.trim(),
    lastName: draft.lastName.trim(),
    email: draft.email.trim(),
    birthDate: draft.birthDate.trim(),
    countryOfIssue: draft.countryOfIssue.trim().toUpperCase(),
    occupation: draft.occupation.trim(),
    annualSalary: draft.annualSalary.trim(),
    accountPurpose: draft.accountPurpose.trim(),
    expectedMonthlyVolume: draft.expectedMonthlyVolume.trim(),
    address: {
      line1: draft.addressLine1.trim(),
      line2: draft.addressLine2.trim() || undefined,
      city: draft.addressCity.trim(),
      region: draft.addressRegion.trim(),
      postalCode: draft.addressPostalCode.trim(),
      countryCode: draft.addressCountryCode.trim().toUpperCase(),
    },
    ...(nationalId ? { nationalId } : {}),
    ...(phoneCountryCode ? { phoneCountryCode } : {}),
    ...(phoneNumber ? { phoneNumber } : {}),
  };
}

export function buildDraftStorageKey(seed: string) {
  return `agent.kyc.v2.draft.${seed}`;
}

export function fieldOrderForStage(stage: KycFormStage, draft: KycFormDraft): KycFormField[] {
  if (stage === "part_1") {
    return [...PART_1_FIELDS];
  }
  if (stage === "part_2") {
    const base = [...PART_2_FIELDS];
    if (!requiresNationalId(draft.countryOfIssue)) {
      return base.filter((field) => field !== "nationalId");
    }
    return base;
  }
  return [...PART_3_FIELDS];
}

export function sanitizeDraft(candidate: unknown): KycFormDraft {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return { ...EMPTY_KYC_DRAFT };
  }
  const record = candidate as Record<string, unknown>;
  const next = { ...EMPTY_KYC_DRAFT };
  (Object.keys(next) as Array<keyof KycFormDraft>).forEach((field) => {
    const value = record[field];
    if (typeof value === "string") {
      next[field] = value;
    }
  });
  return next;
}

function isStage(value: unknown): value is KycFormStage {
  return value === "part_1" || value === "part_2" || value === "part_3";
}

export function parseKycDraftSnapshot(raw: string | null): KycDraftSnapshot | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      draft?: unknown;
      stage?: unknown;
      savedAt?: unknown;
    };
    if (!isStage(parsed.stage)) {
      return null;
    }
    return {
      draft: sanitizeDraft(parsed.draft),
      stage: parsed.stage,
      savedAt:
        typeof parsed.savedAt === "string" && parsed.savedAt.trim().length > 0
          ? parsed.savedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function serializeKycDraftSnapshot(snapshot: KycDraftSnapshot) {
  return JSON.stringify(snapshot);
}
