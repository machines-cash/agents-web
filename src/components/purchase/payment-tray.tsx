"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  AgentBillingDetails,
  AgentCatalogItem,
  AgentPendingAction,
} from "@/contracts";
import { cn } from "../../lib/utils";
import { AgentTray } from "../ui/agent-tray";
import { PaymentPayView } from "./payment-pay-view";
import { PaymentStatusView } from "./payment-status-view";
import { BillingEditSubTray, type BillingFieldErrors } from "./billing-edit-sub-tray";

/* ─── Types ─── */

interface PaymentTrayProps {
  open: boolean;
  onClose: () => void;
  view: "pay" | "status";
  action: AgentPendingAction | null;
  buyingItem: AgentCatalogItem | null;
  onConfirm: (billingOverride?: AgentBillingDetails) => void;
  onSubmitThreeDs: (code: string) => void;
  onMinimize: () => void;
  onOpenBillingEdit: () => void;
  billingEditOpen: boolean;
  onCloseBillingEdit: () => void;
  billingDraft: AgentBillingDetails | null;
  onBillingDraftChange: (next: AgentBillingDetails) => void;
  isBusy: boolean;
  dismissible: boolean;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

function validateBillingDetails(details: AgentBillingDetails | null): BillingFieldErrors {
  if (!details) {
    return {
      name: "name is required",
      email: "email is required",
      addressLine1: "address line 1 is required",
      city: "city is required",
      state: "state is required",
      postalCode: "postal code is required",
      country: "country is required",
    };
  }

  const errors: BillingFieldErrors = {};
  if (!details.name.trim()) errors.name = "name is required";
  if (!details.email.trim()) {
    errors.email = "email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) {
    errors.email = "enter a valid email";
  }
  if (!details.addressLine1.trim()) errors.addressLine1 = "address line 1 is required";
  if (!details.city.trim()) errors.city = "city is required";
  if (!details.state.trim()) errors.state = "state is required";
  if (!details.postalCode.trim()) errors.postalCode = "postal code is required";
  if (!details.country.trim()) errors.country = "country is required";
  return errors;
}

function sanitizeBillingDetails(details: AgentBillingDetails): AgentBillingDetails {
  const next: AgentBillingDetails = {
    name: details.name.trim(),
    email: details.email.trim(),
    addressLine1: details.addressLine1.trim(),
    city: details.city.trim(),
    state: details.state.trim(),
    postalCode: details.postalCode.trim(),
    country: details.country.trim(),
  };
  const addressLine2 = details.addressLine2?.trim();
  if (addressLine2) {
    next.addressLine2 = addressLine2;
  }
  return next;
}

/* ─── Component ─── */

export function PaymentTray({
  open,
  onClose,
  view,
  action,
  buyingItem,
  onConfirm,
  onSubmitThreeDs,
  onMinimize,
  onOpenBillingEdit,
  billingEditOpen,
  onCloseBillingEdit,
  billingDraft,
  onBillingDraftChange,
  isBusy,
  dismissible,
}: PaymentTrayProps) {
  const [billingErrors, setBillingErrors] = useState<BillingFieldErrors>({});
  const [billingInvalid, setBillingInvalid] = useState(false);

  const effectiveBillingDetails = useMemo(
    () => billingDraft ?? action?.billingDetails ?? null,
    [action?.billingDetails, billingDraft],
  );

  useEffect(() => {
    setBillingErrors({});
    setBillingInvalid(false);
  }, [action?.id]);

  const handleBillingChange = useCallback((next: AgentBillingDetails) => {
    onBillingDraftChange(next);
    if (!billingInvalid && Object.keys(billingErrors).length === 0) {
      return;
    }
    const nextErrors = validateBillingDetails(next);
    setBillingErrors(nextErrors);
    setBillingInvalid(Object.keys(nextErrors).length > 0);
  }, [billingErrors, billingInvalid, onBillingDraftChange]);

  const handleConfirm = useCallback(() => {
    const errors = validateBillingDetails(effectiveBillingDetails);
    if (Object.keys(errors).length > 0) {
      setBillingErrors(errors);
      setBillingInvalid(true);
      onOpenBillingEdit();
      return;
    }

    if (!effectiveBillingDetails) {
      setBillingInvalid(true);
      onOpenBillingEdit();
      return;
    }

    setBillingErrors({});
    setBillingInvalid(false);
    onConfirm(sanitizeBillingDetails(effectiveBillingDetails));
  }, [effectiveBillingDetails, onConfirm, onOpenBillingEdit]);

  const handleSaveBilling = useCallback(() => {
    const errors = validateBillingDetails(effectiveBillingDetails);
    setBillingErrors(errors);
    if (Object.keys(errors).length > 0) {
      setBillingInvalid(true);
      return;
    }
    setBillingInvalid(false);
    onCloseBillingEdit();
  }, [effectiveBillingDetails, onCloseBillingEdit]);

  if (!action) return null;

  return (
    <>
      <AgentTray
        open={open}
        onClose={onClose}
        height="auto"
        showHandle={false}
        zIndex={60}
        dismissible={dismissible}
        className="payment-tray-glass"
      >
        {/* ─── Close Button — iOS xmark.circle.fill style ─── */}
        <div className="relative">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "absolute top-[16px] right-[16px] z-10",
              "w-[30px] h-[30px] rounded-full",
              "bg-[rgba(44,44,46,0.95)]",
              "flex items-center justify-center",
              "transition-all duration-100",
              "hover:bg-[rgba(58,58,60,0.95)]",
              "active:scale-[0.88]",
            )}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M1 1L11 11M11 1L1 11"
                stroke="rgba(235,235,245,0.6)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* ─── Content — view transition ─── */}
        <div className="pt-[16px]">
          <AnimatePresence mode="wait">
            {view === "pay" ? (
              <motion.div
                key="pay"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.25, ease: easeOut }}
              >
                <PaymentPayView
                  billingSummary={action.billingSummary ?? null}
                  billingDetails={effectiveBillingDetails}
                  buyingItem={buyingItem}
                  onConfirm={handleConfirm}
                  onOpenBillingEdit={onOpenBillingEdit}
                  disabled={isBusy}
                  billingInvalid={billingInvalid}
                />
              </motion.div>
            ) : (
              <motion.div
                key="status"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: easeOut }}
              >
                <PaymentStatusView
                  action={action}
                  onMinimize={onMinimize}
                  onSubmitThreeDs={onSubmitThreeDs}
                  isBusy={isBusy}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AgentTray>

      {/* ─── Billing Edit Sub-Tray ─── */}
      <BillingEditSubTray
        open={billingEditOpen}
        onClose={onCloseBillingEdit}
        onSave={handleSaveBilling}
        billingDetails={effectiveBillingDetails}
        onChange={handleBillingChange}
        errors={billingErrors}
        isBusy={isBusy}
      />
    </>
  );
}
