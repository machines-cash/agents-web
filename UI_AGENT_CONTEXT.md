# UI Agent Context — `agent.machines.cash` Frontend Foundation

This app exposes non-visual integration logic and page routes. Build UI layers on top of these contracts.

## Route map
- `/` selector landing
- `/machines` machines agent runtime
- `/machines/:chatSessionId` resumed conversation
- `/byo` bring-your-own-agent resources

## Hooks
- `useAgentAuth()`
  - states: `auth_checking`, `bridge_in_progress`, `login_required`, `chat_ready`, `error`
  - methods: `tryBridge`, `loginWithWallet`, `logout`, `hardReset`
  - data: `session`, `walletDiscovery`
- `useAgentChat({ agentSessionToken, initialChatSessionId, enabled })`
  - states: `idle`, `initializing`, `sending`, `awaiting_confirmation`, `error`
  - data: `chatSessionId`, `messages`, `pendingActions`, `lastEvents`
  - methods: `sendMessage`, `confirmAction`, `reload`
- `useByoResources()`
  - returns llms-consumer live resource + placeholders (MCP/skill/connector)

## Event contracts
From `/agent/v1/chat/sessions/:id/messages`:
- `tool_call`
- `requires_purchase_confirmation`
- `purchase_started`
- `purchase_result`
- `unsupported_operation`

## Confirmation flow
1. User sends purchase intent.
2. Response emits `requires_purchase_confirmation` with `actionId`.
3. UI calls `POST /agent/v1/chat/actions/:actionId/confirm` via `confirmAction`.
4. UI refreshes chat state.

## Auth handoff flow
1. Try stored `machines.cash.agent.session`.
2. Attempt app-domain bridge (`/agent-auth-bridge.html`) auto.
3. If app session missing, show wallet login on `agent.machines.cash`.
4. After wallet login, mint app session token then exchange/consume.

## Notes
- Keep unsupported-operation messaging out of landing copy.
- Do not hardcode sandbox/dev language in user-facing text.
- BYO section is informational/placeholder in v1.
