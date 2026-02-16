"use client";

import type { AgentBillingDetails } from "@/contracts";
import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import { AgentTray } from "../ui/agent-tray";
import { Button } from "../ui/button";

export type BillingFieldErrors = Partial<Record<
  "name" | "email" | "addressLine1" | "city" | "state" | "postalCode" | "country",
  string
>>;

interface BillingEditSubTrayProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  billingDetails: AgentBillingDetails | null;
  onChange: (next: AgentBillingDetails) => void;
  errors: BillingFieldErrors;
  isBusy: boolean;
}

function BillingInputRow(props: {
  label: string;
  value: string;
  placeholder: string;
  error?: string;
  optional?: boolean;
  autoCapitalize?: InputHTMLAttributes<HTMLInputElement>["autoCapitalize"];
  keyboard?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-[6px]">
        <span className="text-[13px] text-[rgba(235,235,245,0.6)] leading-[1.3]">
          {props.label}
        </span>
        {props.optional ? (
          <span className="text-[12px] text-[rgba(235,235,245,0.35)] leading-[1.3]">
            optional
          </span>
        ) : null}
      </div>
      <input
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        placeholder={props.placeholder}
        autoCorrect="off"
        autoCapitalize={props.autoCapitalize ?? "words"}
        inputMode={props.keyboard}
        className={cn(
          "w-full h-[40px] rounded-[10px] px-[12px]",
          "text-[14px] text-white placeholder:text-[rgba(235,235,245,0.28)]",
          "bg-[rgba(255,255,255,0.06)] border-[0.5px]",
          "focus:outline-none transition-colors duration-100",
          props.error
            ? "border-[#FF4444] focus:border-[#FF4444]"
            : "border-[rgba(255,255,255,0.09)] focus:border-[rgba(255,255,255,0.22)]",
        )}
      />
      {props.error ? (
        <div className="text-[12px] text-[#FF7B7B] leading-[1.2] mt-[6px]">
          {props.error}
        </div>
      ) : null}
    </label>
  );
}

function emptyBillingDetails(): AgentBillingDetails {
  return {
    name: "",
    email: "",
    addressLine1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  };
}

export function BillingEditSubTray({
  open,
  onClose,
  onSave,
  billingDetails,
  onChange,
  errors,
  isBusy,
}: BillingEditSubTrayProps) {
  const current = billingDetails ?? emptyBillingDetails();

  const update = <K extends keyof AgentBillingDetails>(key: K, value: AgentBillingDetails[K]) => {
    onChange({
      ...current,
      [key]: value,
    });
  };

  return (
    <AgentTray
      open={open}
      onClose={onClose}
      height="auto"
      zIndex={70}
      dismissible
      showHandle
      className="payment-tray-glass"
    >
      <div className="px-[16px] pt-[4px] pb-[20px]">
        <div className="flex items-center justify-between mb-[16px]">
          <span className="text-[17px] font-semibold text-white">
            billing details
          </span>
          <button
            type="button"
            onClick={onClose}
            className={cn(
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

        <div
          className={cn(
            "w-full rounded-[14px] p-[12px]",
            "bg-[rgba(255,255,255,0.06)]",
            "border-[0.5px] border-[rgba(255,255,255,0.06)]",
          )}
        >
          <div className="space-y-[12px]">
            <BillingInputRow
              label="name"
              value={current.name}
              placeholder="full name"
              error={errors.name}
              onChange={(value) => update("name", value)}
            />
            <BillingInputRow
              label="email"
              value={current.email}
              placeholder="email"
              error={errors.email}
              autoCapitalize="none"
              keyboard="email"
              onChange={(value) => update("email", value)}
            />
            <BillingInputRow
              label="address line 1"
              value={current.addressLine1}
              placeholder="street address"
              error={errors.addressLine1}
              onChange={(value) => update("addressLine1", value)}
            />
            <BillingInputRow
              label="address line 2"
              value={current.addressLine2 ?? ""}
              placeholder="apartment, suite, etc."
              optional
              onChange={(value) => update("addressLine2", value)}
            />
            <BillingInputRow
              label="city"
              value={current.city}
              placeholder="city"
              error={errors.city}
              onChange={(value) => update("city", value)}
            />
            <BillingInputRow
              label="state / province"
              value={current.state}
              placeholder="state or province"
              error={errors.state}
              onChange={(value) => update("state", value)}
            />
            <BillingInputRow
              label="postal code"
              value={current.postalCode}
              placeholder="postal code"
              error={errors.postalCode}
              autoCapitalize="characters"
              onChange={(value) => update("postalCode", value)}
            />
            <BillingInputRow
              label="country"
              value={current.country}
              placeholder="country"
              error={errors.country}
              autoCapitalize="characters"
              onChange={(value) => update("country", value)}
            />
          </div>
        </div>

        <Button
          type="button"
          variant="accent"
          size="md"
          className="w-full h-[44px] text-[15px] mt-[14px] font-medium"
          onClick={onSave}
          disabled={isBusy}
          loading={isBusy}
        >
          done
        </Button>
      </div>
    </AgentTray>
  );
}
