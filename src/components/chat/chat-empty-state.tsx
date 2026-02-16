"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Spinner } from "../ui/spinner";
import { cn } from "../../lib/utils";
import { AMAZON_BUY_LIBRARY } from "../../lib/amazon-buy-suggestions";
import { PremiumHeroMark } from "./premium-hero-mark";
import { ChatInputPill } from "./chat-input-pill";

/* ─── Buy-wheel constants ─── */

const staticSuggestions = ["check my balance", "create card"] as const;
const buyRotateIntervalMs = 4000;
const maxBuyDisplayChars = 28;

type WheelDirection = 1 | -1;

function pickRandomBuyIndex(excludeIndex: number | null = null) {
  if (AMAZON_BUY_LIBRARY.length <= 1) return 0;
  let nextIndex = Math.floor(Math.random() * AMAZON_BUY_LIBRARY.length);
  while (excludeIndex !== null && nextIndex === excludeIndex) {
    nextIndex = Math.floor(Math.random() * AMAZON_BUY_LIBRARY.length);
  }
  return nextIndex;
}

function pickWheelDirection(): WheelDirection {
  return Math.random() < 0.5 ? -1 : 1;
}

function toBuyDisplayLabel(item: string) {
  const normalized = item.trim();
  if (normalized.length <= maxBuyDisplayChars) return normalized;

  const withoutTrailingContext = normalized
    .replace(/\s+for\s+.+$/i, "")
    .trim();
  if (
    withoutTrailingContext.length > 0 &&
    withoutTrailingContext.length <= maxBuyDisplayChars
  ) {
    return withoutTrailingContext;
  }

  return `${normalized.slice(0, maxBuyDisplayChars - 1).trimEnd()}…`;
}

/* ─── Suggestion rows ─── */

function SuggestionRows({
  onSelect,
  activeBuyItem,
  activeBuyDisplayItem,
  activeBuyIndex,
  wheelDirection,
  className,
}: {
  onSelect: (text: string) => void;
  activeBuyItem: string;
  activeBuyDisplayItem: string;
  activeBuyIndex: number | null;
  wheelDirection: WheelDirection;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col w-full overflow-hidden",
        className,
      )}
    >
      {staticSuggestions.map((text, i) => (
        <button
          key={text}
          type="button"
          onClick={() => onSelect(text)}
          className={cn(
            "px-[var(--space-4)] py-[var(--space-3)]",
            "text-left text-[length:var(--text-sm)] text-[var(--agent-text-secondary)]",
            "hover:bg-[var(--agent-surface-elevated)]",
            "transition-colors duration-[var(--duration-fast)]",
            "border-b border-[var(--agent-border)]",
            "animate-suggestion-appear opacity-0",
          )}
          style={{
            animationDelay: `${300 + i * 60}ms`,
            animationFillMode: "forwards",
          }}
        >
          {text}
        </button>
      ))}

      {/* Rotating buy suggestion */}
      <button
        type="button"
        onClick={() => onSelect(`buy ${activeBuyItem}`)}
        className={cn(
          "inline-flex items-center gap-[var(--space-1)]",
          "px-[var(--space-4)] py-[var(--space-3)]",
          "text-left text-[length:var(--text-sm)] text-[var(--agent-text-secondary)]",
          "hover:bg-[var(--agent-surface-elevated)]",
          "transition-colors duration-[var(--duration-fast)]",
          "animate-suggestion-appear opacity-0",
        )}
        style={{
          animationDelay: `${300 + staticSuggestions.length * 60}ms`,
          animationFillMode: "forwards",
        }}
      >
        <span className="shrink-0">buy</span>
        <motion.span
          layout
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="relative inline-grid h-[1.2em] max-w-[52vw] overflow-hidden align-middle"
        >
          <span
            aria-hidden
            className="invisible block max-w-full truncate whitespace-nowrap"
          >
            {activeBuyDisplayItem}
          </span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={activeBuyIndex ?? "initial-buy-item"}
              className="absolute inset-0 inline-flex items-center justify-start"
              initial={{
                y: wheelDirection > 0 ? "100%" : "-100%",
                opacity: 0,
              }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{
                y: wheelDirection > 0 ? "-100%" : "100%",
                opacity: 0,
              }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="block max-w-full truncate">
                {activeBuyDisplayItem}
              </span>
            </motion.span>
          </AnimatePresence>
        </motion.span>
      </button>
    </div>
  );
}

/* ─── Main empty state ─── */

export function ChatEmptyState({
  onSend,
  onStop,
  onLogoClick,
  isAuthLoading = false,
  isSending,
  disabled,
  placeholder,
}: {
  onSend: (message: string) => void;
  onStop?: () => void;
  onLogoClick?: () => void;
  isAuthLoading?: boolean;
  isSending: boolean;
  disabled: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ─── Buy-wheel state ─── */
  const [activeBuyIndex, setActiveBuyIndex] = useState<number | null>(null);
  const [wheelDirection, setWheelDirection] = useState<WheelDirection>(1);

  useEffect(() => {
    setActiveBuyIndex(pickRandomBuyIndex());
    setWheelDirection(pickWheelDirection());

    const interval = window.setInterval(() => {
      setWheelDirection(pickWheelDirection());
      setActiveBuyIndex((currentIndex) => pickRandomBuyIndex(currentIndex));
    }, buyRotateIntervalMs);

    return () => window.clearInterval(interval);
  }, []);

  const activeBuyItem = useMemo(() => {
    if (activeBuyIndex === null) return "amazon finds";
    return AMAZON_BUY_LIBRARY[activeBuyIndex] ?? "airpods pro";
  }, [activeBuyIndex]);

  const activeBuyDisplayItem = useMemo(
    () => toBuyDisplayLabel(activeBuyItem),
    [activeBuyItem],
  );

  /* ─── Input handlers ─── */
  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isSending) return;
    setHasSubmitted(true);
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, isSending, onSend]);

  const handleSuggestion = useCallback(
    (text: string) => {
      setHasSubmitted(true);
      onSend(text);
    },
    [onSend],
  );

  const canSend = value.trim().length > 0 && !disabled && !isSending;

  return (
    <div className="flex-1 flex flex-col items-center px-[var(--space-4)]">
      {/*
        Top spacer — on mobile pushes logo to center of upper portion.
        On desktop, takes slightly more than half (3fr vs 2fr below) to
        nudge the block above true center for optical balance.
      */}
      <div className="flex-1 md:flex-[3]" />

      {/* Brand + greeting */}
      <div className="flex flex-col items-center gap-[var(--space-4)] md:gap-[var(--space-6)]">
        <PremiumHeroMark
          onClick={onLogoClick}
          size="var(--hero-mark-size)"
          className="[--hero-mark-size:clamp(80px,16vw,120px)] md:[--hero-mark-size:64px]"
        />

        {isAuthLoading ? (
          <div className="flex items-center gap-[var(--space-3)]">
            <Spinner
              size="sm"
              className="text-[var(--agent-text-secondary)]"
            />
            <p className="text-[var(--text-sm)] text-[var(--agent-text-secondary)]">
              connecting…
            </p>
          </div>
        ) : (
          <h2
            className={cn(
              "text-[length:var(--display-sm)] md:text-[length:36px]",
              "leading-[var(--leading-tight)]",
              "font-medium tracking-[-0.02em]",
              "text-center text-[var(--agent-text-primary)]",
              "opacity-0 animate-hero-fade-up",
            )}
            style={{ animationDelay: "150ms", animationFillMode: "forwards" }}
          >
            what can i do for you?
          </h2>
        )}
      </div>

      {/* Mobile: bottom spacer pushes input block to bottom */}
      <div className="flex-1 md:hidden" />

      {/* Input + suggestions block */}
      <div
        className={cn(
          "w-full max-w-[680px] shrink-0",
          "md:mt-[var(--space-10)]",
        )}
      >
        {/* Mobile: suggestions above input */}
        <div className={cn("md:hidden", (hasSubmitted || isAuthLoading) && "hidden")}>
          <SuggestionRows
            onSelect={handleSuggestion}
            activeBuyItem={activeBuyItem}
            activeBuyDisplayItem={activeBuyDisplayItem}
            activeBuyIndex={activeBuyIndex}
            wheelDirection={wheelDirection}
            className="mb-[var(--space-3)]"
          />
        </div>

        <ChatInputPill
          value={value}
          onChange={setValue}
          onSend={handleSend}
          onStop={onStop}
          disabled={disabled}
          isSending={isSending}
          canSend={canSend}
          placeholder={placeholder}
          textareaRef={textareaRef}
        />

        {/* Desktop: suggestions below input in a contained card */}
        <div
          className={cn(
            "hidden md:block",
            (hasSubmitted || isAuthLoading) && "md:hidden",
          )}
        >
          <SuggestionRows
            onSelect={handleSuggestion}
            activeBuyItem={activeBuyItem}
            activeBuyDisplayItem={activeBuyDisplayItem}
            activeBuyIndex={activeBuyIndex}
            wheelDirection={wheelDirection}
            className="mt-[var(--space-3)]"
          />
        </div>
      </div>

      {/* Bottom spacer — smaller on desktop for optical above-center positioning */}
      <div className="hidden md:block md:flex-[2]" />
    </div>
  );
}
