"use client";

import { useEffect, useCallback, useMemo, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { AgentCatalogItem, AgentKycHelpContext } from "@/contracts";
import { useAgentAuth } from "../hooks/use-agent-auth";
import { useAgentChat } from "../hooks/use-agent-chat";
import { useServerChatHistory } from "../hooks/use-server-chat-history";
import { AgentHeader } from "./layout/agent-header";
import { DesktopSidebar, MobileSidebarOverlay } from "./layout/sidebar";
import { ChatContainer } from "./chat/chat-container";
import { ChatMessageList } from "./chat/chat-message-list";
import { ChatInputBar } from "./chat/chat-input-bar";
import { ChatTypingIndicator } from "./chat/chat-typing-indicator";
import { ChatEmptyState } from "./chat/chat-empty-state";
import { ChatBetaNotice } from "./chat/chat-beta-notice";
import { deriveChatSurfaceMode } from "./chat/chat-surface-mode";
import { LoginTray } from "./auth/login-tray";
import { PaymentTrayController } from "./purchase/payment-tray-controller";
import { Alert } from "./ui/alert";
import { AgentTray } from "./ui/agent-tray";
import { AgentKycFlowV2 } from "./kyc/agent-kyc-flow-v2";
import { useToast } from "./ui/toast-provider";

const allSuggestions = [
  "check my balance",
  "create card",
  "buy airpods pro",
];

export function MachinesAgentShell({
  initialChatSessionId,
}: {
  initialChatSessionId?: string;
}) {
  const auth = useAgentAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const bypassKycV2Gate = process.env.NEXT_PUBLIC_AGENT_KYC_V2_DISABLED === "1";
  const needsAuth =
    auth.state === "login_required" || auth.state === "error";
  const isAuthLoading =
    auth.state === "auth_checking" ||
    auth.state === "bridge_in_progress" ||
    auth.state === "connect_in_progress" ||
    auth.state === "bankr_in_progress";
  const isReady = auth.state === "chat_ready";
  const historyOwnerKey = useMemo(() => {
    const userId = auth.session?.user?.id ?? null;
    if (userId) {
      return userId;
    }
    return auth.session?.user?.walletAddress?.toLowerCase() ?? null;
  }, [auth.session?.user?.id, auth.session?.user?.walletAddress]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showConnectCard, setShowConnectCard] = useState(false);
  const [buyingItem, setBuyingItem] = useState<AgentCatalogItem | null>(null);
  const [kycReadyOverride, setKycReadyOverride] = useState(false);
  const [assistTrayOpen, setAssistTrayOpen] = useState(false);
  const [assistHelpContext, setAssistHelpContext] = useState<AgentKycHelpContext | null>(
    null,
  );
  const [hasSubmittedFirstMessage, setHasSubmittedFirstMessage] = useState(false);
  const prevMessageCount = useRef(0);
  const prevChatSessionIdRef = useRef<string | null>(null);
  const serverHistory = useServerChatHistory({
    agentSessionToken: auth.session?.agentSessionToken ?? "",
    ownerKey: historyOwnerKey,
    enabled: isReady,
  });
  const history = serverHistory;
  const handleSessionUnavailable = useCallback(
    (chatSessionId: string) => {
      showToast(
        `conversation ${chatSessionId.slice(0, 8)} is unavailable. starting a new chat.`,
        "info",
      );
      router.replace("/machines");
    },
    [router, showToast],
  );
  const [queuedGuestMessage, setQueuedGuestMessage] = useState<string | null>(
    null,
  );
  const queuedGuestMessageDispatchingRef = useRef(false);

  const chat = useAgentChat({
    agentSessionToken: auth.session?.agentSessionToken ?? "",
    initialChatSessionId,
    enabled: isReady,
    onUnauthorized: auth.refreshSessionSilently,
    onSessionUnavailable: handleSessionUnavailable,
  });
  const kycUnlockedFromSession = chat.kycSummary?.stage === "completed";
  const kycReady = bypassKycV2Gate || kycUnlockedFromSession || kycReadyOverride;
  const kycStorageSeed =
    auth.session?.user?.id ??
    auth.session?.user?.walletAddress?.toLowerCase() ??
    auth.session?.agentSessionId ??
    "agent";

  // Sync URL with chat session
  useEffect(() => {
    if (!auth.session?.agentSessionToken) return;
    if (!chat.chatSessionId) return;
    const targetPath = `/machines/${chat.chatSessionId}`;
    if (pathname === targetPath) return;
    router.replace(targetPath);
  }, [
    auth.session?.agentSessionToken,
    chat.chatSessionId,
    pathname,
    router,
  ]);

  // Hide connect card once authenticated
  useEffect(() => {
    if (isReady) {
      setShowConnectCard(false);
    }
  }, [isReady]);

  // Reset first-message latch whenever chat session changes.
  useEffect(() => {
    if (chat.chatSessionId === prevChatSessionIdRef.current) {
      return;
    }
    prevChatSessionIdRef.current = chat.chatSessionId;
    setHasSubmittedFirstMessage(false);
  }, [chat.chatSessionId]);

  // Existing chat history marks the session as already submitted once loaded.
  useEffect(() => {
    if (chat.state === "initializing") {
      return;
    }
    if (chat.messages.length === 0) {
      return;
    }
    setHasSubmittedFirstMessage(true);
  }, [chat.messages.length, chat.state]);

  useEffect(() => {
    if (!auth.session?.agentSessionId) {
      return;
    }
    setKycReadyOverride(false);
    setAssistTrayOpen(false);
    setAssistHelpContext(null);
  }, [auth.session?.agentSessionId]);

  useEffect(() => {
    if (kycUnlockedFromSession) {
      setKycReadyOverride(true);
      setAssistTrayOpen(false);
      setAssistHelpContext(null);
    }
  }, [kycUnlockedFromSession]);

  // Flush queued message once auth + chat session are ready.
  useEffect(() => {
    if (!queuedGuestMessage) return;
    if (queuedGuestMessageDispatchingRef.current) return;
    if (!isReady) return;
    if (!chat.chatSessionId) return;
    if (chat.state === "initializing" || chat.state === "sending") return;

    queuedGuestMessageDispatchingRef.current = true;
    setShowConnectCard(false);
    void chat
      .sendMessage(queuedGuestMessage, {
        context: kycReady ? undefined : { kycMode: "assist_only" },
      })
      .finally(() => {
        queuedGuestMessageDispatchingRef.current = false;
        setQueuedGuestMessage(null);
      });
  }, [
    chat.chatSessionId,
    chat.sendMessage,
    chat.state,
    isReady,
    kycReady,
    queuedGuestMessage,
  ]);

  // Track chat in history when messages arrive
  useEffect(() => {
    if (!chat.chatSessionId) return;
    if (chat.messages.length === 0) return;

    const msgCount = chat.messages.length;
    if (msgCount === prevMessageCount.current) return;
    prevMessageCount.current = msgCount;

    // Use first user message as title
    const firstUserMsg = chat.messages.find((m) => m.role === "user");
    const title = firstUserMsg
      ? firstUserMsg.content.length > 40
        ? firstUserMsg.content.slice(0, 40) + "..."
        : firstUserMsg.content
      : "new chat";

    history.addEntry(chat.chatSessionId, title);
    void serverHistory.refresh();
  }, [chat.chatSessionId, chat.messages, history.addEntry, serverHistory.refresh]);

  const isBusy = chat.state === "sending" || chat.state === "initializing";
  const showEmptySurface =
    deriveChatSurfaceMode({
      messageCount: chat.messages.length,
      isBusy,
      hasSubmittedFirstMessage,
    }) === "empty";
  const purchaseActions = chat.pendingActions.filter(
    (action) => action.type === "purchase_confirm",
  );
  const purchaseInProgress = purchaseActions.some((a) =>
    ["confirmed", "processing", "awaiting_3ds"].includes(a.status),
  );

  useEffect(() => {
    if (kycReady) {
      return;
    }
    chat.lastEvents.forEach((event) => {
      if (event.type !== "unsupported_operation") {
        return;
      }
      console.info("[agent-kyc]", "blocked_operation_reason", {
        reason: event.reason,
      });
    });
  }, [chat.lastEvents, kycReady]);

  const handleSend = useCallback(
    (message: string) => {
      const trimmed = message.trim();
      if (!trimmed) {
        return;
      }
      setHasSubmittedFirstMessage(true);
      if (needsAuth) {
        setQueuedGuestMessage(trimmed);
        setShowConnectCard(true);
        return;
      }
      void chat.sendMessage(trimmed);
    },
    [chat.sendMessage, needsAuth],
  );

  const handleAssistSend = useCallback(
    (message: string) => {
      const trimmed = message.trim();
      if (!trimmed || needsAuth) {
        if (needsAuth) {
          setShowConnectCard(true);
        }
        return;
      }

      const context: AgentKycHelpContext | null = assistHelpContext;
      if (context) {
        console.info("[agent-kyc]", "share_context_on_failure", {
          source: context.source,
          failedFieldCount: context.failedFields?.length ?? 0,
        });
      }

      void chat.sendMessage(trimmed, {
        context: {
          kycMode: "assist_only",
          ...(context ? { kycHelpContext: context } : {}),
        },
      });
      setAssistHelpContext(null);
      setHasSubmittedFirstMessage(true);
    },
    [assistHelpContext, chat.sendMessage, needsAuth],
  );

  const handleOpenAssist = useCallback(
    (options?: { helpContext?: AgentKycHelpContext }) => {
      if (options?.helpContext) {
        setAssistHelpContext(options.helpContext);
      } else {
        setAssistHelpContext(null);
      }
      console.info("[agent-kyc]", "help_entry_opened", {
        source: options?.helpContext?.source ?? "general",
      });
      setAssistTrayOpen(true);
    },
    [],
  );

  const handleKycReady = useCallback(() => {
    setKycReadyOverride(true);
    setAssistHelpContext(null);
    setAssistTrayOpen(false);
    void chat.reload?.();
  }, [chat.reload]);

  const handleLogoClick = useCallback(() => {
    if (!needsAuth || isAuthLoading) return;
    setShowConnectCard(true);
  }, [isAuthLoading, needsAuth]);

  const handleBuyItem = useCallback(
    (item: AgentCatalogItem) => {
      setBuyingItem(item);
      const message = `buy ${item.title}${item.url ? ` ${item.url}` : ""}`;
      handleSend(message);
    },
    [handleSend],
  );

  const handleNewChat = useCallback(() => {
    router.push("/machines");
    setSidebarOpen(false);
  }, [router]);

  const handleSelectChat = useCallback(
    (chatSessionId: string) => {
      router.push(`/machines/${chatSessionId}`);
      setSidebarOpen(false);
    },
    [router],
  );

  const handleRenameChat = useCallback(
    async (chatSessionId: string, newTitle: string) => {
      try {
        await serverHistory.renameEntry(chatSessionId, newTitle);
      } catch {
        showToast("failed to rename chat", "error");
      }
    },
    [serverHistory.renameEntry, showToast],
  );

  const handleArchiveChat = useCallback(
    async (chatSessionId: string) => {
      try {
        await serverHistory.archiveEntry(chatSessionId);
        if (chat.chatSessionId === chatSessionId) {
          router.push("/machines");
        }
        showToast("chat archived", "info");
      } catch {
        showToast("failed to archive chat", "error");
      }
    },
    [serverHistory.archiveEntry, chat.chatSessionId, router, showToast],
  );

  const handleDeleteChat = useCallback(
    async (chatSessionId: string) => {
      try {
        await serverHistory.deleteEntry(chatSessionId);
        if (chat.chatSessionId === chatSessionId) {
          router.push("/machines");
        }
      } catch {
        showToast("failed to delete chat", "error");
      }
    },
    [serverHistory.deleteEntry, chat.chatSessionId, router, showToast],
  );

  const handleLogout = useCallback(() => {
    setSidebarOpen(false);
    setShowConnectCard(false);
    queuedGuestMessageDispatchingRef.current = false;
    setQueuedGuestMessage(null);
    auth.logout();
    router.replace("/");
  }, [auth, router]);

  const walletAddress = auth.session?.user?.walletAddress ?? null;

  return (
    <div className="flex h-[calc(var(--agent-vh,1vh)*100)]">
      {/* Desktop sidebar — always visible when authenticated */}
      {isReady && kycReady && (
        <div className="hidden md:flex">
          <DesktopSidebar
            entries={history.entries}
            activeChatSessionId={chat.chatSessionId}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
            walletAddress={walletAddress}
            onRenameChat={handleRenameChat}
            onArchiveChat={handleArchiveChat}
            onDeleteChat={handleDeleteChat}
          />
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {isReady && kycReady && sidebarOpen && (
        <MobileSidebarOverlay
          entries={history.entries}
          activeChatSessionId={chat.chatSessionId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onClose={() => setSidebarOpen(false)}
          walletAddress={walletAddress}
          onRenameChat={handleRenameChat}
          onArchiveChat={handleArchiveChat}
          onDeleteChat={handleDeleteChat}
        />
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        <AgentHeader
          session={auth.session}
          onLogout={isReady ? handleLogout : undefined}
          onNewChat={isReady && kycReady ? handleNewChat : undefined}
          onToggleSidebar={isReady && kycReady ? () => setSidebarOpen(true) : undefined}
        />

        {isReady && !kycReady ? (
          <AgentKycFlowV2
            agentSessionToken={auth.session?.agentSessionToken ?? ""}
            storageSeed={kycStorageSeed}
            onReady={handleKycReady}
            onAskAgent={handleOpenAssist}
          />
        ) : (
          <ChatContainer>
            <AnimatePresence initial={false} mode="wait">
              {showEmptySurface ? (
                <motion.div
                  key="empty"
                  className="flex-1 flex flex-col min-h-0"
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ChatEmptyState
                    onSend={handleSend}
                    onStop={chat.stopGenerating}
                    onLogoClick={handleLogoClick}
                    isAuthLoading={isAuthLoading}
                    isSending={chat.state === "sending"}
                    disabled={isAuthLoading}
                    placeholder={
                      needsAuth ? "ask machines agent" : "ask anything"
                    }
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="conversation"
                  className="flex-1 flex flex-col min-h-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ChatMessageList
                    messages={chat.messages}
                    events={chat.lastEvents}
                    agentSessionToken={auth.session?.agentSessionToken ?? ""}
                    onBuyItem={handleBuyItem}
                  />

                  {/* Typing indicator */}
                  {chat.state === "sending" && <ChatTypingIndicator />}

                  {/* Error */}
                  {chat.error && (
                    <div className="px-[var(--space-4)] md:px-[var(--space-6)]">
                      <Alert variant="error">{chat.error}</Alert>
                    </div>
                  )}

                  <ChatInputBar
                    onSend={handleSend}
                    onStop={chat.stopGenerating}
                    disabled={isAuthLoading || purchaseInProgress}
                    isSending={chat.state === "sending"}
                    suggestions={allSuggestions}
                    placeholder={
                      purchaseInProgress
                        ? "purchase in progress..."
                        : needsAuth
                          ? "ask machines agent"
                          : "ask anything"
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <ChatBetaNotice />
          </ChatContainer>
        )}

        {/* Payment tray — Apple Pay-style purchase flow (renders via portal) */}
        {kycReady ? (
          <PaymentTrayController
            purchaseActions={purchaseActions}
            onConfirm={(actionId, billingOverride) =>
              void chat.confirmAction(actionId, { billingOverride })
            }
            onSubmitThreeDs={(actionId, code) =>
              void chat.submitThreeDsCode(actionId, code)
            }
            isBusy={isBusy}
            buyingItem={buyingItem}
          />
        ) : null}
      </div>

      <AgentTray
        open={assistTrayOpen}
        onClose={() => setAssistTrayOpen(false)}
        height="large"
        showHandle
        zIndex={90}
      >
        <div className="flex h-[85vh] min-h-[440px] flex-col">
          <div className="border-b border-[var(--agent-border)] px-[var(--space-4)] py-[var(--space-4)]">
            <p className="text-[var(--text-sm)] text-[var(--agent-text-primary)]">ask agent</p>
            <p className="mt-[var(--space-1)] text-[var(--text-xs)] text-[var(--agent-text-secondary)]">
              chat stays available while verification is in progress.
            </p>
            {assistHelpContext ? (
              <p className="mt-[var(--space-2)] text-[var(--text-xs)] text-[var(--agent-text-muted)]">
                this message will include masked failure context only (error code/message and failed fields).
              </p>
            ) : null}
          </div>

          <div className="flex flex-1 min-h-0 flex-col">
            <ChatMessageList
              messages={chat.messages}
              events={chat.lastEvents}
              agentSessionToken={auth.session?.agentSessionToken ?? ""}
            />

            {chat.state === "sending" ? <ChatTypingIndicator /> : null}

            {chat.error ? (
              <div className="px-[var(--space-4)]">
                <Alert variant="error">{chat.error}</Alert>
              </div>
            ) : null}

            <ChatInputBar
              onSend={handleAssistSend}
              onStop={chat.stopGenerating}
              disabled={isAuthLoading}
              isSending={chat.state === "sending"}
              suggestions={[]}
              placeholder={needsAuth ? "ask machines agent" : "ask about verification"}
            />
          </div>
        </div>
      </AgentTray>

      {/* Login modal — opens when unauthenticated user tries to interact */}
      <LoginTray
        open={showConnectCard}
        onClose={() => setShowConnectCard(false)}
        auth={auth}
        dismissible={true}
        sourcePrefix="chat"
      />
    </div>
  );
}
