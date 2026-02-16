"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  AgentBillingDetails,
  AgentCatalogItem,
  AgentPendingAction,
} from "@/contracts";
import { usePaymentTray } from "../../hooks/use-payment-tray";
import { PaymentTray } from "./payment-tray";
import { PaymentMinimizedWidget } from "./payment-minimized-widget";

/* ─── Types ─── */

interface PaymentTrayControllerProps {
  purchaseActions: AgentPendingAction[];
  onConfirm: (actionId: string, billingOverride?: AgentBillingDetails) => void;
  onSubmitThreeDs: (actionId: string, code: string) => void;
  isBusy: boolean;
  buyingItem: AgentCatalogItem | null;
}

function asDraftValue(value: string | null | undefined) {
  if (!value) return "";
  const normalized = value.trim().toLowerCase();
  if (normalized === "missing" || normalized === "hidden") {
    return "";
  }
  return value.trim();
}

function toInitialDraft(action: AgentPendingAction): AgentBillingDetails {
  if (action.billingDetails) {
    return {
      ...action.billingDetails,
      addressLine2: action.billingDetails.addressLine2 ?? "",
    };
  }

  return {
    name: asDraftValue(action.billingSummary?.name),
    email: asDraftValue(action.billingSummary?.email),
    addressLine1: "",
    addressLine2: "",
    city: asDraftValue(action.billingSummary?.city),
    state: asDraftValue(action.billingSummary?.state),
    postalCode: "",
    country: asDraftValue(action.billingSummary?.country),
  };
}

/* ─── Component ─── */

export function PaymentTrayController({
  purchaseActions,
  onConfirm,
  onSubmitThreeDs,
  isBusy,
  buyingItem,
}: PaymentTrayControllerProps) {
  const tray = usePaymentTray({ purchaseActions, isBusy });
  const [billingDraftByActionId, setBillingDraftByActionId] = useState<
    Record<string, AgentBillingDetails>
  >({});

  useEffect(() => {
    const activeAction = tray.activeAction;
    if (!activeAction) return;
    setBillingDraftByActionId((current) => {
      if (current[activeAction.id]) {
        return current;
      }
      return {
        ...current,
        [activeAction.id]: toInitialDraft(activeAction),
      };
    });
  }, [tray.activeAction]);

  const activeBillingDraft = useMemo(() => {
    if (!tray.activeAction) return null;
    return (
      billingDraftByActionId[tray.activeAction.id] ??
      toInitialDraft(tray.activeAction)
    );
  }, [billingDraftByActionId, tray.activeAction]);

  const handleConfirm = (billingOverride?: AgentBillingDetails) => {
    if (tray.activeAction) {
      onConfirm(tray.activeAction.id, billingOverride);
    }
  };

  const handleSubmitThreeDs = (code: string) => {
    if (tray.activeAction) {
      onSubmitThreeDs(tray.activeAction.id, code);
    }
  };

  return (
    <>
      <PaymentTray
        open={tray.trayOpen}
        onClose={tray.closeTray}
        view={tray.view === "pay" ? "pay" : "status"}
        action={tray.activeAction}
        buyingItem={buyingItem}
        onConfirm={handleConfirm}
        onSubmitThreeDs={handleSubmitThreeDs}
        onMinimize={tray.minimizeTray}
        onOpenBillingEdit={tray.openBillingEdit}
        billingEditOpen={tray.billingEditOpen}
        onCloseBillingEdit={tray.closeBillingEdit}
        billingDraft={activeBillingDraft}
        onBillingDraftChange={(next) => {
          const activeAction = tray.activeAction;
          if (!activeAction) return;
          setBillingDraftByActionId((current) => ({
            ...current,
            [activeAction.id]: next,
          }));
        }}
        isBusy={isBusy}
        dismissible={tray.isPending || tray.isTerminal}
      />
      <PaymentMinimizedWidget
        visible={tray.view === "minimized"}
        action={tray.activeAction}
        onExpand={tray.expandFromMinimized}
      />
    </>
  );
}
