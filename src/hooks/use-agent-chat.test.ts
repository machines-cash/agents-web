import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AgentActionConfirmResponse, AgentPendingAction } from "@/contracts";
import { applyConfirmActionResponse } from "./use-agent-chat.ts";

function makeAction(id: string): AgentPendingAction {
  return {
    id,
    type: "purchase_confirm",
    status: "pending",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    confirmedAt: null,
    workflowId: null,
    orderId: null,
    quoteId: null,
    paymentStatus: null,
    message: null,
    billingSummary: null,
    progress: null,
  };
}

function makeConfirmResponse(actionId: string): AgentActionConfirmResponse {
  return {
    actionId,
    status: "processing",
    message: "processing secure checkout",
  };
}

describe("applyConfirmActionResponse", () => {
  it("replaces stale pending action when confirm returns a replacement action id", () => {
    const requestedActionId = "action_old";
    const current = [makeAction(requestedActionId), makeAction("action_other")];
    const response = makeConfirmResponse("action_new");

    const next = applyConfirmActionResponse(current, requestedActionId, response);

    assert.equal(next.canonicalActionId, "action_new");
    assert.equal(next.actions.some((entry) => entry.id === requestedActionId), false);
    assert.equal(next.actions.some((entry) => entry.id === "action_new"), true);
    assert.equal(next.actions.some((entry) => entry.id === "action_other"), true);
  });

  it("keeps the same action id when confirm response action id matches request", () => {
    const requestedActionId = "action_same";
    const current = [makeAction(requestedActionId)];
    const response = makeConfirmResponse(requestedActionId);

    const next = applyConfirmActionResponse(current, requestedActionId, response);

    assert.equal(next.canonicalActionId, requestedActionId);
    assert.equal(next.actions.length, 1);
    assert.equal(next.actions[0]?.id, requestedActionId);
    assert.equal(next.actions[0]?.status, "processing");
  });
});
