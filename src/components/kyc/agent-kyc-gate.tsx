"use client";

import type {
  AgentKycApplicationPayload,
  AgentKycStatusResponse,
} from "@/contracts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  acceptAgentKycAgreements,
  getAgentKycStatus,
  submitAgentKycApplication,
} from "../../lib/agent-api";
import { Button } from "../ui/button";
import { Alert } from "../ui/alert";
import { Input } from "../ui/input";

type FormValues = {
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

type QuestionStep = {
  key: keyof FormValues;
  prompt: string;
  placeholder?: string;
  type?: "text" | "email" | "date" | "tel";
  options?: Array<{ value: string; label: string }>;
  optional?: boolean;
};

function normalizeKycStatus(status?: string | null) {
  return (status ?? "").toLowerCase().replace(/[\s-]/g, "_");
}

function isChatUnlocked(status: AgentKycStatusResponse | null) {
  if (!status) return false;
  return (
    normalizeKycStatus(status.status) === "approved" &&
    Boolean(status.isTermsOfServiceAccepted)
  );
}

function formatStatusLabel(status?: string | null) {
  const normalized = normalizeKycStatus(status);
  if (!normalized) return "not started";
  return normalized.replace(/_/g, " ");
}

const COUNTRY_OPTIONS = [
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

export function AgentKycGate({
  agentSessionToken,
  onReady,
}: {
  agentSessionToken: string;
  onReady: () => void;
}) {
  const [status, setStatus] = useState<AgentKycStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [acceptingAgreements, setAcceptingAgreements] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [formValues, setFormValues] = useState<FormValues>({
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
  });
  const completionNotifiedRef = useRef(false);

  const steps = useMemo<QuestionStep[]>(() => {
    const dynamicSteps: QuestionStep[] = [
      {
        key: "firstName",
        prompt: "what is your legal first name?",
        placeholder: "first name",
      },
      {
        key: "lastName",
        prompt: "what is your legal last name?",
        placeholder: "last name",
      },
      {
        key: "email",
        prompt: "what email should we use for compliance updates?",
        type: "email",
        placeholder: "name@example.com",
      },
      { key: "birthDate", prompt: "what is your date of birth?", type: "date" },
      {
        key: "countryOfIssue",
        prompt: "which country issued your identity document?",
        options: COUNTRY_OPTIONS,
      },
    ];

    const country = formValues.countryOfIssue.trim().toUpperCase();
    if (country === "US" || country === "CA") {
      dynamicSteps.push({
        key: "nationalId",
        prompt: "enter your ssn/sin (required for us and canada).",
        placeholder:
          country === "US"
            ? "social security number"
            : "social insurance number",
      });
    }

    dynamicSteps.push(
      {
        key: "occupation",
        prompt: "what best describes your occupation?",
        options: [
          { value: "15-1132", label: "software developer" },
          { value: "13-2051", label: "financial analyst" },
          { value: "11-1021", label: "operations manager" },
          { value: "SELFEMP", label: "self-employed" },
          { value: "UNEMPLO", label: "unemployed" },
          { value: "OTHERXX", label: "other" },
        ],
      },
      {
        key: "annualSalary",
        prompt: "what is your annual salary range?",
        options: [
          { value: "<40k", label: "under $40k" },
          { value: "50k–99k", label: "$50k-$99k" },
          { value: "100k–149k", label: "$100k-$149k" },
          { value: "150k+", label: "$150k+" },
        ],
      },
      {
        key: "accountPurpose",
        prompt: "what is the main purpose of this account?",
        options: [
          { value: "everyday spend", label: "everyday spend" },
          { value: "subscriptions", label: "subscriptions" },
          { value: "business expenses", label: "business expenses" },
          { value: "testing", label: "testing" },
          { value: "other", label: "other" },
        ],
      },
      {
        key: "expectedMonthlyVolume",
        prompt: "what monthly spend do you expect?",
        options: [
          { value: "under $1k", label: "under $1k" },
          { value: "$1k–$5k", label: "$1k-$5k" },
          { value: "$5k–$20k", label: "$5k-$20k" },
          { value: "$20k+", label: "$20k+" },
        ],
      },
      {
        key: "addressLine1",
        prompt: "street address line 1?",
        placeholder: "street address",
      },
      {
        key: "addressLine2",
        prompt: "street address line 2? (optional)",
        optional: true,
        placeholder: "apartment, suite, etc.",
      },
      { key: "addressCity", prompt: "city?", placeholder: "city" },
      {
        key: "addressRegion",
        prompt: "state / province / region?",
        placeholder: "state or province",
      },
      {
        key: "addressPostalCode",
        prompt: "postal code?",
        placeholder: "postal code",
      },
      {
        key: "addressCountryCode",
        prompt: "country of residence?",
        options: COUNTRY_OPTIONS,
      },
      {
        key: "phoneCountryCode",
        prompt: "phone country code (optional).",
        optional: true,
        type: "tel",
        placeholder: "1",
      },
      {
        key: "phoneNumber",
        prompt: "phone number (optional).",
        optional: true,
        type: "tel",
        placeholder: "5551234567",
      },
    );

    return dynamicSteps;
  }, [formValues.countryOfIssue]);

  const activeStep =
    steps[Math.min(stepIndex, Math.max(steps.length - 1, 0))] ?? null;
  const canMoveBack = stepIndex > 0;
  const isFinalStep = stepIndex >= steps.length - 1;

  const refreshStatus = useCallback(async () => {
    setLoadingStatus(true);
    setStatusError(null);
    try {
      const next = await getAgentKycStatus(agentSessionToken);
      setStatus(next);
      if (isChatUnlocked(next) && !completionNotifiedRef.current) {
        completionNotifiedRef.current = true;
        onReady();
      }
    } catch (error) {
      setStatusError(
        error instanceof Error ? error.message : "failed to fetch kyc status",
      );
    } finally {
      setLoadingStatus(false);
    }
  }, [agentSessionToken, onReady]);

  useEffect(() => {
    completionNotifiedRef.current = false;
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    const normalized = normalizeKycStatus(status?.status);
    const shouldPoll =
      normalized === "pending" ||
      normalized === "manual_review" ||
      normalized === "needs_information" ||
      normalized === "needs_verification";
    if (!shouldPoll) {
      return;
    }

    const interval = window.setInterval(() => {
      void refreshStatus();
    }, 15_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [refreshStatus, status?.status]);

  const setCurrentValue = useCallback(
    (value: string) => {
      if (!activeStep) return;
      setFormValues((current) => ({
        ...current,
        [activeStep.key]: value,
      }));
    },
    [activeStep],
  );

  const getCurrentValue = useCallback(() => {
    if (!activeStep) return "";
    return formValues[activeStep.key] ?? "";
  }, [activeStep, formValues]);

  const validateCurrentStep = useCallback(() => {
    if (!activeStep) return true;
    const raw = (formValues[activeStep.key] ?? "").trim();
    if (activeStep.optional) {
      return true;
    }
    if (!raw) {
      setSubmitError("please complete the current field before continuing.");
      return false;
    }
    if (activeStep.key === "email") {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
      if (!isEmail) {
        setSubmitError("enter a valid email address.");
        return false;
      }
    }
    if (activeStep.key === "birthDate") {
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) {
        setSubmitError("enter a valid birth date.");
        return false;
      }
    }
    setSubmitError(null);
    return true;
  }, [activeStep, formValues]);

  const handleNextStep = useCallback(() => {
    if (!validateCurrentStep()) {
      return;
    }
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }, [steps.length, validateCurrentStep]);

  const buildApplicationPayload = useCallback((): AgentKycApplicationPayload => {
    const nationalId = formValues.nationalId.trim();
    const phoneCountryCode = formValues.phoneCountryCode.trim();
    const phoneNumber = formValues.phoneNumber.trim();

    return {
      firstName: formValues.firstName.trim(),
      lastName: formValues.lastName.trim(),
      email: formValues.email.trim(),
      birthDate: formValues.birthDate.trim(),
      countryOfIssue: formValues.countryOfIssue.trim().toUpperCase(),
      occupation: formValues.occupation.trim(),
      annualSalary: formValues.annualSalary.trim(),
      accountPurpose: formValues.accountPurpose.trim(),
      expectedMonthlyVolume: formValues.expectedMonthlyVolume.trim(),
      address: {
        line1: formValues.addressLine1.trim(),
        line2: formValues.addressLine2.trim() || undefined,
        city: formValues.addressCity.trim(),
        region: formValues.addressRegion.trim(),
        postalCode: formValues.addressPostalCode.trim(),
        countryCode: formValues.addressCountryCode.trim().toUpperCase(),
      },
      ...(nationalId ? { nationalId } : {}),
      ...(phoneCountryCode ? { phoneCountryCode } : {}),
      ...(phoneNumber ? { phoneNumber } : {}),
    };
  }, [formValues]);

  const handleSubmitApplication = useCallback(async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const submitted = await submitAgentKycApplication(
        agentSessionToken,
        buildApplicationPayload(),
      );
      setStatus(submitted);
      if (isChatUnlocked(submitted) && !completionNotifiedRef.current) {
        completionNotifiedRef.current = true;
        onReady();
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "failed to submit kyc questionnaire",
      );
    } finally {
      setSubmitting(false);
    }
  }, [agentSessionToken, buildApplicationPayload, onReady, validateCurrentStep]);

  const handleAcceptAgreements = useCallback(async () => {
    setAcceptingAgreements(true);
    setSubmitError(null);
    try {
      const accepted = await acceptAgentKycAgreements(agentSessionToken);
      setStatus(accepted);
      if (isChatUnlocked(accepted) && !completionNotifiedRef.current) {
        completionNotifiedRef.current = true;
        onReady();
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "failed to accept agreements",
      );
    } finally {
      setAcceptingAgreements(false);
    }
  }, [agentSessionToken, onReady]);

  const normalizedStatus = normalizeKycStatus(status?.status);
  const verificationLink =
    status?.externalVerificationLink?.url ?? status?.completionLink?.url ?? null;

  return (
    <div className="flex flex-1 items-center justify-center p-[var(--space-4)] md:p-[var(--space-6)]">
      <div className="w-full max-w-[760px] rounded-[var(--radius-lg)] border border-[var(--agent-border)] bg-[var(--agent-surface)] p-[var(--space-6)] md:p-[var(--space-8)]">
        <h2 className="text-[var(--text-lg)] font-light text-[var(--agent-text-primary)]">
          account setup
        </h2>
        <p className="mt-[var(--space-2)] text-[var(--text-sm)] text-[var(--agent-text-secondary)]">
          before chat starts, we need a few identity details for card compliance.
        </p>

        {statusError && (
          <Alert variant="error" className="mt-[var(--space-4)]">
            {statusError}
          </Alert>
        )}
        {submitError && (
          <Alert variant="error" className="mt-[var(--space-4)]">
            {submitError}
          </Alert>
        )}

        {loadingStatus && (
          <p className="mt-[var(--space-5)] text-[var(--text-sm)] text-[var(--agent-text-secondary)]">
            checking verification status…
          </p>
        )}

        {!loadingStatus && !status && (
          <div className="mt-[var(--space-5)]">
            <Button variant="secondary" size="sm" onClick={() => void refreshStatus()}>
              retry status check
            </Button>
          </div>
        )}

        {!loadingStatus && status && (
          <div className="mt-[var(--space-5)] space-y-[var(--space-5)]">
            <p className="text-[var(--text-xs)] uppercase tracking-[0.12em] text-[var(--agent-text-muted)]">
              current status: {formatStatusLabel(status.status)}
            </p>

            {(normalizedStatus === "pending" ||
              normalizedStatus === "manual_review") && (
              <div className="space-y-[var(--space-3)]">
                <p className="text-[var(--text-sm)] text-[var(--agent-text-secondary)]">
                  your application is under review. this page refreshes automatically.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void refreshStatus()}
                >
                  refresh now
                </Button>
              </div>
            )}

            {(normalizedStatus === "needs_information" ||
              normalizedStatus === "needs_verification") && (
              <div className="space-y-[var(--space-3)]">
                <p className="text-[var(--text-sm)] text-[var(--agent-text-secondary)]">
                  we need one more verification step before chat can continue.
                </p>
                {verificationLink && (
                  <a
                    href={verificationLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-[var(--radius-sm)] bg-[var(--orange)] px-[var(--space-4)] py-[var(--space-2)] text-[var(--text-sm)] text-white hover:opacity-90"
                  >
                    continue verification
                  </a>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void refreshStatus()}
                >
                  i completed verification
                </Button>
              </div>
            )}

            {normalizedStatus === "approved" &&
              !status.isTermsOfServiceAccepted && (
                <div className="space-y-[var(--space-3)]">
                  <p className="text-[var(--text-sm)] text-[var(--agent-text-secondary)]">
                    verification is approved. accept card agreements to unlock chat.
                  </p>
                  <Button
                    variant="accent"
                    size="md"
                    loading={acceptingAgreements}
                    disabled={acceptingAgreements}
                    onClick={() => void handleAcceptAgreements()}
                  >
                    accept agreements
                  </Button>
                </div>
              )}

            {(normalizedStatus === "denied" ||
              normalizedStatus === "locked" ||
              normalizedStatus === "canceled") && (
              <div className="space-y-[var(--space-3)]">
                <p className="text-[var(--text-sm)] text-[var(--agent-text-secondary)]">
                  this verification state requires support assistance before chat can continue.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void refreshStatus()}
                >
                  refresh status
                </Button>
              </div>
            )}

            {(normalizedStatus === "not_submitted" || normalizedStatus === "") && (
              <div className="space-y-[var(--space-4)]">
                <div className="space-y-[var(--space-2)]">
                  <p className="text-[var(--text-sm)] text-[var(--agent-text-secondary)]">
                    {activeStep ? activeStep.prompt : "complete the questionnaire"}
                  </p>

                  {activeStep?.options ? (
                    <select
                      className="w-full rounded-[var(--radius-sm)] border border-[var(--gray-600)] bg-[var(--agent-bg)] px-[var(--space-4)] py-[var(--space-3)] text-[var(--text-sm)] text-[var(--agent-text-primary)] focus:border-[var(--violet)] focus:outline-none"
                      value={getCurrentValue()}
                      onChange={(event) => setCurrentValue(event.target.value)}
                    >
                      {activeStep.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={activeStep?.type ?? "text"}
                      placeholder={activeStep?.placeholder}
                      value={getCurrentValue()}
                      onChange={(event) => setCurrentValue(event.target.value)}
                    />
                  )}
                </div>

                <div className="flex items-center justify-between gap-[var(--space-3)]">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!canMoveBack}
                    onClick={() =>
                      setStepIndex((current) => Math.max(0, current - 1))
                    }
                  >
                    back
                  </Button>

                  {isFinalStep ? (
                    <Button
                      variant="accent"
                      size="md"
                      loading={submitting}
                      disabled={submitting}
                      onClick={() => void handleSubmitApplication()}
                    >
                      submit questionnaire
                    </Button>
                  ) : (
                    <Button variant="primary" size="sm" onClick={handleNextStep}>
                      next
                    </Button>
                  )}
                </div>

                <p className="text-[var(--text-xs)] text-[var(--agent-text-muted)]">
                  step {Math.min(stepIndex + 1, steps.length)} of {steps.length}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
