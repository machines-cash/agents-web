"use client";

import {
  AGENT_BRIDGE_EVENT_TYPE,
  buildAgentBridgeUrl,
  createBridgeState,
  isAgentBridgeEnvelope,
  type AgentBridgeErrorMessage,
  type AgentBridgeSuccessMessage,
} from "@/contracts";
import { useCallback } from "react";
import { resolveAgentOrigin, resolveApiBase, resolveAppOrigin } from "../lib/api-base";

export type AgentBridgeResult =
  | { ok: true; message: AgentBridgeSuccessMessage }
  | { ok: false; message: AgentBridgeErrorMessage };

function buildError(state: string, code: AgentBridgeErrorMessage["code"], message: string): AgentBridgeResult {
  return {
    ok: false,
    message: {
      type: "error",
      state,
      code,
      message,
    },
  };
}

export function useAgentExchangeBridge() {
  const runBridge = useCallback(async (options?: { silent?: boolean }): Promise<AgentBridgeResult> => {
    const appOrigin = resolveAppOrigin();
    const agentOrigin = resolveAgentOrigin();
    const apiBaseUrl = resolveApiBase();
    const state = createBridgeState();
    const bridgeUrl = buildAgentBridgeUrl({
      appOrigin,
      targetOrigin: agentOrigin,
      state,
      apiBaseUrl,
    });

    return new Promise<AgentBridgeResult>((resolve) => {
      const timeoutMs = 30_000;
      let done = false;
      const iframeId = `machines-agent-exchange-${state}`;
      let popup: Window | null = null;
      let iframe: HTMLIFrameElement | null = null;

      if (options?.silent) {
        iframe = document.createElement("iframe");
        iframe.id = iframeId;
        iframe.src = `${bridgeUrl}&transport=iframe`;
        iframe.setAttribute("aria-hidden", "true");
        iframe.style.position = "absolute";
        iframe.style.width = "1px";
        iframe.style.height = "1px";
        iframe.style.opacity = "0";
        iframe.style.pointerEvents = "none";
        iframe.style.border = "0";
        document.body.appendChild(iframe);
      } else {
        popup = window.open(
          bridgeUrl,
          "machines-agent-exchange",
          "popup=yes,width=520,height=680",
        );
        if (!popup) {
          resolve(buildError(state, "popup_blocked", "popup blocked"));
          return;
        }
      }

      const cleanup = () => {
        if (done) return;
        done = true;
        window.removeEventListener("message", onMessage);
        window.clearTimeout(timeoutId);
        if (closedCheckId !== null) {
          window.clearInterval(closedCheckId);
        }
        if (popup) {
          try {
            popup.close();
          } catch {
            // ignore
          }
        }
        if (iframe) {
          try {
            iframe.remove();
          } catch {
            // ignore
          }
        }
      };

      const resolveAndCleanup = (result: AgentBridgeResult) => {
        cleanup();
        resolve(result);
      };

      const onMessage = (event: MessageEvent) => {
        if (event.origin !== appOrigin) {
          return;
        }
        if (!isAgentBridgeEnvelope(event.data)) {
          return;
        }
        if (event.data.eventType !== AGENT_BRIDGE_EVENT_TYPE) {
          return;
        }
        const payload = event.data.payload;
        if (payload.state !== state) {
          return;
        }
        if (payload.type === "success") {
          resolveAndCleanup({ ok: true, message: payload });
          return;
        }
        resolveAndCleanup({ ok: false, message: payload });
      };

      const timeoutId = window.setTimeout(() => {
        resolveAndCleanup(buildError(state, "timeout", "bridge timed out"));
      }, timeoutMs);

      const closedCheckId = popup
        ? window.setInterval(() => {
            if (popup && popup.closed) {
              resolveAndCleanup(buildError(state, "timeout", "bridge closed"));
            }
          }, 500)
        : null;

      window.addEventListener("message", onMessage);
    });
  }, []);

  return {
    runBridge,
  };
}
