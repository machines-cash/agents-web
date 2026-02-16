"use client";

import type { AgentKycHelpContext, AgentKycStatusResponse } from "@/contracts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ApiRequestError } from "../../lib/api-base";
import {
  acceptAgentKycAgreements,
  getAgentKycStatus,
  submitAgentKycApplication,
} from "../../lib/agent-api";
import { cn } from "../../lib/utils";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { KycStageAccountUse } from "./kyc-stage-account-use";
import { KycStageBasic } from "./kyc-stage-basic";
import { KycStageIdentityAddress } from "./kyc-stage-identity-address";
import { KycStageProviderHandoff } from "./kyc-stage-provider-handoff";
import { KycStatusView } from "./kyc-status-view";
import {
  EMPTY_KYC_DRAFT,
  buildApplicationPayload,
  buildDraftStorageKey,
  classifyKycFlowStage,
  fieldOrderForStage,
  isChatUnlocked,
  getVerificationLink,
  parseKycDraftSnapshot,
  serializeKycDraftSnapshot,
  type KycFieldErrorMap,
  type KycFormDraft,
  type KycFormField,
  type KycFormStage,
  validatePart1,
  validatePart2,
  validatePart3,
} from "./kyc-flow-v2-utils";

const KYC_POLL_INTERVAL_MS = 15_000;

const KNOWN_KYC_FIELDS: Array<{ key: KycFormField; aliases: string[] }> = [
  { key: "firstName", aliases: ["first name", "firstname"] },
  { key: "lastName", aliases: ["last name", "lastname"] },
  { key: "email", aliases: ["email"] },
  { key: "birthDate", aliases: ["birthdate", "date of birth", "dob"] },
  { key: "countryOfIssue", aliases: ["countryofissue", "country of issue"] },
  { key: "nationalId", aliases: ["nationalid", "ssn", "sin"] },
  { key: "occupation", aliases: ["occupation"] },
  { key: "annualSalary", aliases: ["annualsalary", "salary"] },
  { key: "accountPurpose", aliases: ["accountpurpose", "purpose"] },
  { key: "expectedMonthlyVolume", aliases: ["expectedmonthlyvolume", "monthly volume"] },
  { key: "addressLine1", aliases: ["addressline1", "line1", "address line 1"] },
  { key: "addressLine2", aliases: ["addressline2", "line2", "address line 2"] },
  { key: "addressCity", aliases: ["addresscity", "city"] },
  { key: "addressRegion", aliases: ["addressregion", "region", "state", "province"] },
  { key: "addressPostalCode", aliases: ["addresspostalcode", "postal", "zip"] },
  { key: "addressCountryCode", aliases: ["addresscountrycode", "address country"] },
  { key: "phoneCountryCode", aliases: ["phonecountrycode", "phone code", "country code"] },
  { key: "phoneNumber", aliases: ["phonenumber", "phone number"] },
];

function logKycEvent(event: string, metadata?: Record<string, unknown>) {
  if (metadata) {
    console.info("[agent-kyc]", event, metadata);
    return;
  }
  console.info("[agent-kyc]", event);
}

function extractFailedFieldsFromMessage(message: string): KycFormField[] {
  const normalized = message.toLowerCase();
  const matches: KycFormField[] = [];
  for (const field of KNOWN_KYC_FIELDS) {
    if (field.aliases.some((alias) => normalized.includes(alias))) {
      matches.push(field.key);
    }
  }
  return Array.from(new Set(matches));
}

function toSafeErrorMessage(message: string) {
  return message.trim().slice(0, 280);
}

function getStageNumber(stage: KycFormStage) {
  if (stage === "part_1") return 1;
  if (stage === "part_2") return 2;
  return 3;
}

type FieldRef = HTMLInputElement | HTMLSelectElement | null;
type FieldRefCallback = (element: FieldRef) => void;

/* ─── Inline UI components ─── */

const TOTAL_FORM_STEPS = 3;

function KycProgressDots({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-[var(--space-2)]">
      {Array.from({ length: TOTAL_FORM_STEPS }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        return (
          <motion.div
            key={step}
            className="relative flex items-center justify-center"
            layout
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <motion.div
              className={cn(
                "rounded-full",
                isActive || isCompleted
                  ? "bg-[var(--violet)]"
                  : "bg-[rgba(255,255,255,0.15)]",
              )}
              animate={{
                width: isActive ? 24 : 8,
                height: 8,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

function KycBottomBar({
  formStage,
  submitting,
  onBack,
  onContinuePart1,
  onContinuePart2,
  onSubmit,
}: {
  formStage: KycFormStage;
  submitting: boolean;
  onBack: () => void;
  onContinuePart1: () => void;
  onContinuePart2: () => void;
  onSubmit: () => void;
}) {
  const isFirstStep = formStage === "part_1";
  const isLastStep = formStage === "part_3";

  return (
    <div
      className="payment-tray-glass relative shrink-0"
      style={{
        paddingBottom: "calc(var(--space-4) + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="mx-auto flex w-full max-w-[500px] items-center px-[var(--space-5)] pt-[var(--space-4)]">
        {!isFirstStep ? (
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className={cn(
              "flex h-[48px] w-[48px] shrink-0 items-center justify-center",
              "rounded-full",
              "text-[var(--agent-text-secondary)]",
              "transition-all duration-[var(--duration-fast)]",
              "hover:bg-[rgba(255,255,255,0.06)]",
              "active:scale-[0.92]",
              "disabled:pointer-events-none disabled:opacity-40",
            )}
            aria-label="go back"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        ) : (
          <div className="w-[48px] shrink-0" />
        )}

        {isLastStep ? (
          <Button
            variant="accent"
            size="lg"
            className="mx-[var(--space-3)] min-h-[52px] flex-1"
            loading={submitting}
            disabled={submitting}
            onClick={onSubmit}
          >
            submit application
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            className="mx-[var(--space-3)] min-h-[52px] flex-1"
            disabled={submitting}
            onClick={formStage === "part_1" ? onContinuePart1 : onContinuePart2}
          >
            continue
          </Button>
        )}

        <div className="w-[48px] shrink-0" />
      </div>
    </div>
  );
}

function KycLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-[var(--space-20)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <div
          className="flex h-[80px] w-[80px] items-center justify-center rounded-full"
          style={{
            background: "rgba(123, 47, 255, 0.08)",
            boxShadow: "0 0 30px rgba(123, 47, 255, 0.15)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <Spinner size="lg" className="text-[var(--violet)]" />
        </div>
      </motion.div>
      <motion.p
        className="animate-thinking mt-[var(--space-4)] text-[var(--text-sm)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        checking verification status
      </motion.p>
    </div>
  );
}

/* ─── Main component ─── */

export function AgentKycFlowV2({
  agentSessionToken,
  storageSeed,
  onReady,
  onAskAgent,
}: {
  agentSessionToken: string;
  storageSeed: string;
  onReady: () => void;
  onAskAgent: (options?: { helpContext?: AgentKycHelpContext }) => void;
}) {
  const [status, setStatus] = useState<AgentKycStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusRefreshing, setStatusRefreshing] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [acceptingAgreements, setAcceptingAgreements] = useState(false);
  const [openingProvider, setOpeningProvider] = useState(false);
  const [draft, setDraft] = useState<KycFormDraft>(EMPTY_KYC_DRAFT);
  const [formStage, setFormStage] = useState<KycFormStage>("part_1");
  const [fieldErrors, setFieldErrors] = useState<KycFieldErrorMap>({});
  const [errorSummary, setErrorSummary] = useState<string | null>(null);
  const [lastHelpContext, setLastHelpContext] = useState<AgentKycHelpContext | null>(
    null,
  );

  const readyNotifiedRef = useRef(false);
  const fieldRefs = useRef<Partial<Record<KycFormField, FieldRef>>>({});

  const storageKey = useMemo(() => buildDraftStorageKey(storageSeed), [storageSeed]);
  const flowStatusStage = classifyKycFlowStage(status);
  const verificationUrl = getVerificationLink(status);
  const showForm = flowStatusStage === "form";
  const currentStep = showForm ? getStageNumber(formStage) : 4;

  const registerField = useCallback(
    (field: KycFormField): FieldRefCallback =>
      (element) => {
        fieldRefs.current[field] = element;
      },
    [],
  );

  const clearPersistedDraft = useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(storageKey);
    }
    setDraft(EMPTY_KYC_DRAFT);
    setFormStage("part_1");
  }, [storageKey]);

  const refreshStatus = useCallback(
    async (source: "initial" | "manual" | "poll" | "post_submit" | "post_agreements" | "completed_step") => {
      if (source === "initial") {
        setStatusLoading(true);
      } else {
        setStatusRefreshing(true);
      }
      setStatusError(null);

      try {
        const nextStatus = await getAgentKycStatus(agentSessionToken);
        setStatus(nextStatus);
        logKycEvent("status_refresh", {
          source,
          status: nextStatus.status,
          normalizedStage: classifyKycFlowStage(nextStatus),
        });

        if (isChatUnlocked(nextStatus) && !readyNotifiedRef.current) {
          readyNotifiedRef.current = true;
          clearPersistedDraft();
          logKycEvent("approval_unlock", {
            status: nextStatus.status,
          });
          onReady();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "failed to load verification status";
        setStatusError(message);
        setLastHelpContext({
          source: "status_check",
          errorCode: error instanceof ApiRequestError ? error.code ?? undefined : undefined,
          message: toSafeErrorMessage(message),
        });
      } finally {
        if (source === "initial") {
          setStatusLoading(false);
        } else {
          setStatusRefreshing(false);
        }
      }
    },
    [agentSessionToken, clearPersistedDraft, onReady],
  );

  const focusFirstErrorField = useCallback(
    (errors: KycFieldErrorMap, stage: KycFormStage) => {
      const orderedFields = fieldOrderForStage(stage, draft);
      const firstField = orderedFields.find((field) => Boolean(errors[field]));
      if (!firstField) {
        return;
      }
      const element = fieldRefs.current[firstField];
      if (!element) {
        return;
      }
      window.requestAnimationFrame(() => {
        element.focus();
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    },
    [draft],
  );

  const applyValidationErrors = useCallback(
    (stage: KycFormStage, errors: KycFieldErrorMap, source: "continue" | "submit") => {
      setFieldErrors(errors);
      const names = Object.keys(errors);
      if (names.length === 0) {
        setErrorSummary(null);
        return false;
      }

      const summary =
        names.length === 1
          ? "please fix 1 field before continuing."
          : `please fix ${names.length} fields before continuing.`;
      setErrorSummary(summary);
      setSubmitError(null);
      focusFirstErrorField(errors, stage);
      names.forEach((field) => {
        logKycEvent("validation_failure", {
          stage,
          source,
          field,
        });
      });
      return true;
    },
    [focusFirstErrorField],
  );

  const handleAskAgent = useCallback(
    (context?: AgentKycHelpContext | null) => {
      const hasContext = Boolean(context);
      logKycEvent("assist_entry_opened", {
        source: context?.source ?? "general",
        hasContext,
      });
      onAskAgent(context ? { helpContext: context } : undefined);
    },
    [onAskAgent],
  );

  const handleContinuePart1 = useCallback(() => {
    const errors = validatePart1(draft);
    if (applyValidationErrors("part_1", errors, "continue")) {
      return;
    }

    setFormStage("part_2");
    setFieldErrors({});
    setErrorSummary(null);
    setLastHelpContext(null);
    logKycEvent("continue_clicked", {
      stage: "part_1",
      nextStage: "part_2",
    });
  }, [applyValidationErrors, draft]);

  const handleContinuePart2 = useCallback(() => {
    const errors = validatePart2(draft);
    if (applyValidationErrors("part_2", errors, "continue")) {
      return;
    }

    setFormStage("part_3");
    setFieldErrors({});
    setErrorSummary(null);
    setLastHelpContext(null);
    logKycEvent("continue_clicked", {
      stage: "part_2",
      nextStage: "part_3",
    });
  }, [applyValidationErrors, draft]);

  const handleSubmitApplication = useCallback(async () => {
    const errors = validatePart3(draft);
    if (applyValidationErrors("part_3", errors, "submit")) {
      setLastHelpContext({
        source: "application_submit",
        failedFields: Object.keys(errors),
      });
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setLastHelpContext(null);
    logKycEvent("submit_attempt", {
      stage: "part_3",
    });

    try {
      const submitted = await submitAgentKycApplication(
        agentSessionToken,
        buildApplicationPayload(draft),
      );
      setStatus(submitted);
      clearPersistedDraft();
      setFieldErrors({});
      setErrorSummary(null);
      logKycEvent("submit_success", {
        status: submitted.status,
      });

      if (isChatUnlocked(submitted) && !readyNotifiedRef.current) {
        readyNotifiedRef.current = true;
        logKycEvent("approval_unlock", {
          status: submitted.status,
        });
        onReady();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "failed to submit verification questionnaire";
      setSubmitError(message);
      const failedFields = extractFailedFieldsFromMessage(message);
      setLastHelpContext({
        source: "application_submit",
        errorCode: error instanceof ApiRequestError ? error.code ?? undefined : undefined,
        message: toSafeErrorMessage(message),
        failedFields: failedFields.length > 0 ? failedFields : undefined,
      });
      logKycEvent("submit_fail", {
        errorCode: error instanceof ApiRequestError ? error.code : undefined,
        failedFields,
      });
    } finally {
      setSubmitting(false);
    }
  }, [
    agentSessionToken,
    applyValidationErrors,
    clearPersistedDraft,
    draft,
    onReady,
  ]);

  const handleAcceptAgreements = useCallback(async () => {
    setAcceptingAgreements(true);
    setSubmitError(null);

    try {
      const accepted = await acceptAgentKycAgreements(agentSessionToken);
      setStatus(accepted);
      logKycEvent("agreements_accepted", {
        status: accepted.status,
      });
      if (isChatUnlocked(accepted) && !readyNotifiedRef.current) {
        readyNotifiedRef.current = true;
        logKycEvent("approval_unlock", {
          status: accepted.status,
        });
        onReady();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "failed to accept agreements";
      setSubmitError(message);
      setLastHelpContext({
        source: "application_submit",
        errorCode: error instanceof ApiRequestError ? error.code ?? undefined : undefined,
        message: toSafeErrorMessage(message),
      });
    } finally {
      setAcceptingAgreements(false);
    }
  }, [agentSessionToken, onReady]);

  const openVerificationProvider = useCallback(() => {
    if (!verificationUrl) {
      return;
    }
    setOpeningProvider(true);
    window.open(verificationUrl, "_blank", "noopener,noreferrer");
    logKycEvent("provider_handoff_opened", {
      hasUrl: true,
    });
    window.setTimeout(() => {
      setOpeningProvider(false);
    }, 450);
  }, [verificationUrl]);

  useEffect(() => {
    readyNotifiedRef.current = false;
    void refreshStatus("initial");
  }, [refreshStatus]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const parsed = parseKycDraftSnapshot(window.sessionStorage.getItem(storageKey));
    if (!parsed) {
      return;
    }
    setDraft(parsed.draft);
    setFormStage(parsed.stage);
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const snapshot = {
      draft,
      stage: formStage,
      savedAt: new Date().toISOString(),
    };
    window.sessionStorage.setItem(storageKey, serializeKycDraftSnapshot(snapshot));
  }, [draft, formStage, storageKey]);

  useEffect(() => {
    if (flowStatusStage !== "review") {
      return;
    }

    const interval = window.setInterval(() => {
      void refreshStatus("poll");
    }, KYC_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [flowStatusStage, refreshStatus]);

  useEffect(() => {
    const stageLabel = showForm ? formStage : flowStatusStage;
    logKycEvent("stage_viewed", {
      stage: stageLabel,
      status: status?.status ?? "not_submitted",
    });
  }, [flowStatusStage, formStage, showForm, status?.status]);

  const hasGeneralError = Boolean(statusError || submitError || errorSummary);

  const handleFieldChange = useCallback((field: keyof KycFormDraft, value: string) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }, []);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* ─── Progress dots ─── */}
      {showForm && !statusLoading ? (
        <div className="shrink-0 pt-[var(--space-6)] pb-[var(--space-4)]">
          <KycProgressDots currentStep={currentStep} />
        </div>
      ) : null}

      {/* ─── Scrollable content ─── */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <div className="mx-auto w-full max-w-[500px] px-[var(--space-5)]">

          {/* ─── Error display ─── */}
          {hasGeneralError ? (
            <div className="space-y-[var(--space-3)] pt-[var(--space-4)]" aria-live="polite">
              {errorSummary ? (
                <Alert variant="error">{errorSummary}</Alert>
              ) : null}
              {statusError ? (
                <Alert variant="error">
                  {statusError}
                  <div className="mt-[var(--space-3)] flex flex-wrap gap-[var(--space-2)]">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => void refreshStatus("manual")}
                      className="min-h-[44px]"
                    >
                      retry
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAskAgent(lastHelpContext)}
                      className="min-h-[44px]"
                    >
                      ask agent
                    </Button>
                  </div>
                </Alert>
              ) : null}
              {submitError ? (
                <Alert variant="error">
                  {submitError}
                  <div className="mt-[var(--space-3)]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAskAgent(lastHelpContext)}
                      className="min-h-[44px]"
                    >
                      ask agent with error context
                    </Button>
                  </div>
                </Alert>
              ) : null}
            </div>
          ) : null}

          {/* ─── Loading state ─── */}
          {statusLoading ? <KycLoadingState /> : null}

          {/* ─── Form stages with animated transitions ─── */}
          {!statusLoading && showForm ? (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={formStage}
                initial={{ opacity: 0, x: 80 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -80 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as const }}
              >
                {formStage === "part_1" ? (
                  <KycStageBasic
                    draft={draft}
                    errors={fieldErrors}
                    onFieldChange={handleFieldChange}
                    registerField={registerField}
                  />
                ) : null}

                {formStage === "part_2" ? (
                  <KycStageIdentityAddress
                    draft={draft}
                    errors={fieldErrors}
                    onFieldChange={handleFieldChange}
                    registerField={registerField}
                  />
                ) : null}

                {formStage === "part_3" ? (
                  <KycStageAccountUse
                    draft={draft}
                    errors={fieldErrors}
                    onFieldChange={handleFieldChange}
                    registerField={registerField}
                  />
                ) : null}
              </motion.div>
            </AnimatePresence>
          ) : null}

          {/* ─── Provider handoff ─── */}
          {!statusLoading && !showForm && flowStatusStage === "provider_handoff" ? (
            <KycStageProviderHandoff
              verificationUrl={verificationUrl}
              opening={openingProvider}
              onOpenProvider={openVerificationProvider}
              onCompleted={() => void refreshStatus("completed_step")}
              onAskAgent={() => handleAskAgent(lastHelpContext)}
            />
          ) : null}

          {/* ─── Status views ─── */}
          {!statusLoading && !showForm && flowStatusStage === "review" && status ? (
            <KycStatusView
              status={status.status}
              mode="review"
              reason={status.reason}
              refreshing={statusRefreshing}
              accepting={acceptingAgreements}
              onRefresh={() => void refreshStatus("manual")}
              onAcceptAgreements={() => void handleAcceptAgreements()}
              onAskAgent={() => handleAskAgent(lastHelpContext)}
            />
          ) : null}

          {!statusLoading && !showForm && flowStatusStage === "agreements" && status ? (
            <KycStatusView
              status={status.status}
              mode="agreements"
              reason={status.reason}
              refreshing={statusRefreshing}
              accepting={acceptingAgreements}
              onRefresh={() => void refreshStatus("manual")}
              onAcceptAgreements={() => void handleAcceptAgreements()}
              onAskAgent={() => handleAskAgent(lastHelpContext)}
            />
          ) : null}

          {!statusLoading && !showForm && flowStatusStage === "terminal" && status ? (
            <KycStatusView
              status={status.status}
              mode="terminal"
              reason={status.reason}
              refreshing={statusRefreshing}
              accepting={acceptingAgreements}
              onRefresh={() => void refreshStatus("manual")}
              onAcceptAgreements={() => void handleAcceptAgreements()}
              onAskAgent={() => handleAskAgent(lastHelpContext)}
            />
          ) : null}

          {!statusLoading && !showForm && flowStatusStage === "complete" && status ? (
            <KycStatusView
              status={status.status}
              mode="complete"
              reason={status.reason}
              refreshing={statusRefreshing}
              accepting={acceptingAgreements}
              onRefresh={() => void refreshStatus("manual")}
              onAcceptAgreements={() => void handleAcceptAgreements()}
              onAskAgent={() => handleAskAgent(lastHelpContext)}
            />
          ) : null}

        </div>
      </div>

      {/* ─── Sticky bottom CTA bar (form stages only) ─── */}
      {!statusLoading && showForm ? (
        <KycBottomBar
          formStage={formStage}
          submitting={submitting}
          onBack={() => {
            if (formStage === "part_3") {
              setFormStage("part_2");
              return;
            }
            if (formStage === "part_2") {
              setFormStage("part_1");
            }
          }}
          onContinuePart1={handleContinuePart1}
          onContinuePart2={handleContinuePart2}
          onSubmit={() => void handleSubmitApplication()}
        />
      ) : null}
    </div>
  );
}
