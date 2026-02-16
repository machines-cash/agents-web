"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type {
  AgentChatMessage,
  AgentCatalogItem,
  AgentCatalogResultsEvent,
  AgentKycActionRequiredEvent,
  AgentKycCompleteEvent,
  AgentKycProgressEvent,
  ChatEventEnvelope,
} from "@/contracts";
import { ChatMessage } from "./chat-message";
import { ChatToolEvent } from "./chat-tool-event";
import { ProductCatalogCarousel } from "./product-catalog-carousel";
import { cn } from "../../lib/utils";
import { useCatalogImages } from "../../hooks/use-catalog-images";

const showDebugEvents = process.env.NEXT_PUBLIC_AGENT_SHOW_DEBUG_EVENTS === "1";

function extractCatalogItems(events: ChatEventEnvelope[]): AgentCatalogItem[] {
  const event = events.find(
    (e): e is AgentCatalogResultsEvent => e.type === "catalog_results",
  );
  return event?.items ?? [];
}

function extractKycEvents(events: ChatEventEnvelope[]) {
  return events.filter(
    (event): event is AgentKycProgressEvent | AgentKycActionRequiredEvent | AgentKycCompleteEvent =>
      event.type === "kyc_progress" ||
      event.type === "kyc_action_required" ||
      event.type === "kyc_complete",
  );
}

function KycEventCards({ events }: { events: ReturnType<typeof extractKycEvents> }) {
  if (events.length === 0) return null;
  return (
    <div className="mb-[var(--space-4)] flex flex-col gap-[var(--space-2)]">
      {events.map((event, index) => {
        if (event.type === "kyc_complete") {
          return (
            <div
              key={`kyc-${index}`}
              className="rounded-[16px] border border-[#1f5138] bg-[#0f2a1f] px-[var(--space-3)] py-[var(--space-2)] text-[var(--text-sm)] text-[#9fe5be]"
            >
              identity verified. you’re ready.
            </div>
          );
        }
        if (event.type === "kyc_action_required") {
          return (
            <div
              key={`kyc-${index}`}
              className="rounded-[16px] border border-[#59491d] bg-[#2a230f] px-[var(--space-3)] py-[var(--space-2)] text-[var(--text-sm)] text-[#f3d98e]"
            >
              <p>{event.message}</p>
              {event.verificationUrl && (
                <a
                  href={event.verificationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-[var(--space-1)] inline-block underline"
                >
                  open verification
                </a>
              )}
            </div>
          );
        }
        return (
          <div
            key={`kyc-${index}`}
            className="rounded-[16px] border border-[var(--agent-border)] bg-[var(--agent-surface)] px-[var(--space-3)] py-[var(--space-2)] text-[var(--text-sm)] text-[var(--agent-text-secondary)]"
          >
            kyc: {event.stage.split("_").join(" ")}
            {event.nextPrompt ? ` · ${event.nextPrompt}` : ""}
          </div>
        );
      })}
    </div>
  );
}

export function ChatMessageList({
  messages,
  events,
  agentSessionToken,
  onBuyItem,
}: {
  messages: AgentChatMessage[];
  events: ChatEventEnvelope[];
  agentSessionToken: string;
  onBuyItem?: (item: AgentCatalogItem) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [isAtBottom, setIsAtBottom] = useState(true);
  const prevMessageCount = useRef(messages.length);

  const catalogItems = useMemo(() => extractCatalogItems(events), [events]);
  const kycEvents = useMemo(() => extractKycEvents(events), [events]);
  const hydratedCatalogItems = useCatalogImages({
    items: catalogItems,
    agentSessionToken,
  });

  /* Find the index of the latest user message */
  const lastUserMessageIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") return i;
    }
    return -1;
  }, [messages]);

  /* Scroll behavior:
     - When a NEW user message arrives → scroll so it's at the TOP of viewport
     - When an assistant reply arrives → scroll to bottom (message grows downward) */
  useEffect(() => {
    const count = messages.length;
    const prevCount = prevMessageCount.current;
    prevMessageCount.current = count;

    if (count <= prevCount) return; // no new message
    if (!isAtBottom) return; // user has scrolled up, don't auto-scroll

    const latestMessage = messages[count - 1];

    if (latestMessage?.role === "user" && lastUserMessageIndex >= 0) {
      // User sent a message — scroll it to the top
      const el = messageRefs.current.get(lastUserMessageIndex);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      // Assistant replied — scroll to bottom so reply is visible
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, lastUserMessageIndex, isAtBottom, messages]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 100;
    setIsAtBottom(
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold,
    );
  }, []);

  const scrollToLatest = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtBottom(true);
  }, []);

  const setMessageRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      if (el) {
        messageRefs.current.set(index, el);
      }
    },
    [],
  );

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto hide-scrollbar px-[var(--space-4)] md:px-[var(--space-6)] pt-[var(--space-8)] pb-[var(--space-4)]"
      >
        <div className="flex flex-col gap-[var(--space-6)]">
          {messages.map((message, index) => {
            const isLast = index === messages.length - 1;
            const isLastAssistant = isLast && message.role === "assistant";

            return (
              <div key={`${message.createdAt}-${index}`} ref={setMessageRef(index)}>
                {/* Product catalog carousel — shown above the assistant text */}
                {isLastAssistant && hydratedCatalogItems.length > 0 && (
                  <ProductCatalogCarousel
                    items={hydratedCatalogItems}
                    onBuy={onBuyItem}
                  />
                )}
                {isLastAssistant && kycEvents.length > 0 && (
                  <KycEventCards events={kycEvents} />
                )}
                <ChatMessage
                  message={message}
                  isLatest={isLast}
                />
              </div>
            );
          })}

          {/* Tool events are hidden by default in production UX */}
          {showDebugEvents && events.length > 0 && (
            <div className="flex flex-col gap-[var(--space-2)]">
              {events.map((event, index) => (
                <ChatToolEvent key={`event-${index}`} event={event} />
              ))}
            </div>
          )}
        </div>
        <div ref={endRef} />
      </div>

      {/* Scroll to latest pill — minimal icon only */}
      {!isAtBottom && (
        <button
          type="button"
          onClick={scrollToLatest}
          className={cn(
            "absolute bottom-[var(--space-4)] left-1/2 -translate-x-1/2",
            "flex items-center justify-center",
            "w-[36px] h-[36px]",
            "bg-[var(--agent-surface)] rounded-full",
            "shadow-[var(--shadow-md)]",
            "text-[var(--agent-text-secondary)]",
            "transition-all duration-[var(--duration-fast)]",
            "hover:bg-[var(--agent-surface-elevated)]",
            "active:scale-[0.92]",
          )}
          aria-label="scroll to latest"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}
    </div>
  );
}
