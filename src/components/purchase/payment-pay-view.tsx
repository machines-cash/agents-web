"use client";

import type {
  AgentBillingDetails,
  AgentBillingSummary,
  AgentCatalogItem,
} from "@/contracts";
import { cn } from "../../lib/utils";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { Button } from "../ui/button";
import { CardIcon } from "./card-icon";
import { SlideToConfirm } from "./slide-to-confirm";

/* ─── Types ─── */

interface PaymentPayViewProps {
  billingSummary: AgentBillingSummary | null;
  billingDetails: AgentBillingDetails | null;
  buyingItem: AgentCatalogItem | null;
  onConfirm: () => void;
  onOpenBillingEdit: () => void;
  disabled: boolean;
  billingInvalid: boolean;
}

function isPresent(value: string | null | undefined) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 && normalized !== "missing" && normalized !== "hidden";
}

function maskAddressLine1(line1: string) {
  const compact = line1.trim().replace(/\s+/g, " ");
  if (!compact) return "";
  if (compact.length <= 6) return `${compact.slice(0, 1)}***`;
  return `${compact.slice(0, 6)}…`;
}

function maskPostalCode(postalCode: string) {
  const compact = postalCode.trim();
  if (!compact) return "";
  if (compact.length <= 2) return `${compact.slice(0, 1)}*`;
  return `${compact.slice(0, 2)}${"*".repeat(Math.max(2, compact.length - 2))}`;
}

function formatAddressFromSummary(summary: AgentBillingSummary) {
  return [
    summary.addressLine1Masked,
    summary.city,
    summary.state,
    summary.postalCodeMasked,
    summary.country,
  ]
    .filter((value) => isPresent(value))
    .join(", ");
}

function formatAddressFromDetails(details: AgentBillingDetails) {
  return [
    maskAddressLine1(details.addressLine1),
    details.city,
    details.state,
    maskPostalCode(details.postalCode),
    details.country,
  ]
    .filter((value) => isPresent(value))
    .join(", ");
}

function buildSubtitle(
  billingSummary: AgentBillingSummary | null,
  billingDetails: AgentBillingDetails | null,
) {
  const name = billingDetails?.name?.trim() || billingSummary?.name?.trim() || "";
  const address = billingDetails
    ? formatAddressFromDetails(billingDetails)
    : billingSummary
      ? formatAddressFromSummary(billingSummary)
      : "";

  if (name && address) {
    return `${name} ${address}`;
  }
  if (address) {
    return address;
  }
  if (name) {
    return name;
  }
  return "cardholder";
}

/* ─── Component ─── */

export function PaymentPayView({
  billingSummary,
  billingDetails,
  buyingItem,
  onConfirm,
  onOpenBillingEdit,
  disabled,
  billingInvalid,
}: PaymentPayViewProps) {
  const isMobile = useIsMobile();
  const price = buyingItem?.price ?? null;
  const subtitle = buildSubtitle(billingSummary, billingDetails);

  return (
    <div className="flex flex-col pb-[20px]">
      {/* ━━━ Card Tile — premium compact row ━━━
          Layout: [Card Art]  [Name + Detail (stacked right-aligned)]  [Chevron]
          The tile itself is like a raised dark-glass capsule.
      */}
      <div className="px-[16px] mb-[28px]">
        <button
          type="button"
          onClick={onOpenBillingEdit}
          className={cn(
            "w-full flex items-center",
            "rounded-[12px] h-[52px] px-[12px]",
            /* Dark elevated surface — like a card floating on glass */
            billingInvalid
              ? "bg-[rgba(255,68,68,0.09)] border-[1px] border-[#FF4444]"
              : "bg-[rgba(255,255,255,0.06)] border-[0.5px] border-[rgba(255,255,255,0.05)]",
            "transition-all duration-100",
            "hover:bg-[rgba(255,255,255,0.08)]",
            "active:scale-[0.985]",
            "text-left",
          )}
        >
          {/* Card art — slightly larger, is the visual anchor */}
          <div className="shrink-0">
            <CardIcon width={40} />
          </div>

          {/* Text block — card name top, holder name bottom */}
          <div className="flex-1 min-w-0 ml-[12px]">
            <div className="text-[14px] text-white font-medium leading-[1.2] tracking-[-0.01em]">
              machines single use card
            </div>
            <div className="text-[12px] text-[rgba(235,235,245,0.4)] leading-[1.2] mt-[2px] truncate">
              {subtitle}
            </div>
          </div>

          {/* Chevron — iOS chevron.right, tertiary color */}
          <svg
            width="7"
            height="12"
            viewBox="0 0 7 12"
            fill="none"
            className="shrink-0 ml-[8px]"
          >
            <path
              d="M1 1L6 6L1 11"
              stroke="rgba(235,235,245,0.25)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* ━━━ Merchant + Amount (centered) ━━━ */}
      <div className="flex flex-col items-center px-[16px] mb-[28px]">
        {/* "pay amazon" — muted label */}
        <span className="text-[15px] text-[rgba(235,235,245,0.6)] leading-[1.3]">
          pay amazon
        </span>
        {/* Amount — large bold white */}
        {price ? (
          <span className="text-[34px] font-semibold text-white leading-[1.15] mt-[4px] tracking-[-0.02em]">
            {price}
          </span>
        ) : (
          <span className="text-[20px] text-[rgba(235,235,245,0.3)] mt-[4px]">
            amount pending
          </span>
        )}
      </div>

      {/* ━━━ Confirm — slide on mobile, button on desktop ━━━ */}
      <div className="px-[16px]">
        {isMobile ? (
          <SlideToConfirm onConfirm={onConfirm} disabled={disabled} />
        ) : (
          <Button
            variant="accent"
            size="lg"
            className="w-full h-[50px] text-[15px] font-medium"
            onClick={onConfirm}
            loading={disabled}
            disabled={disabled}
          >
            confirm purchase
          </Button>
        )}
      </div>
    </div>
  );
}
