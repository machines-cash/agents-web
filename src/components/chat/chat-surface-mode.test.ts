import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveChatSurfaceMode } from "./chat-surface-mode.ts";

describe("deriveChatSurfaceMode", () => {
  it("returns empty for idle sessions with no messages and no submitted latch", () => {
    const mode = deriveChatSurfaceMode({
      messageCount: 0,
      isBusy: false,
      hasSubmittedFirstMessage: false,
    });

    assert.equal(mode, "empty");
  });

  it("returns conversation immediately after first submit latch flips", () => {
    const mode = deriveChatSurfaceMode({
      messageCount: 0,
      isBusy: false,
      hasSubmittedFirstMessage: true,
    });

    assert.equal(mode, "conversation");
  });

  it("returns conversation while busy even when no messages exist yet", () => {
    const mode = deriveChatSurfaceMode({
      messageCount: 0,
      isBusy: true,
      hasSubmittedFirstMessage: false,
    });

    assert.equal(mode, "conversation");
  });

  it("returns empty for a new session reset with no messages and no busy state", () => {
    const mode = deriveChatSurfaceMode({
      messageCount: 0,
      isBusy: false,
      hasSubmittedFirstMessage: false,
    });

    assert.equal(mode, "empty");
  });

  it("returns conversation when existing chats already have messages", () => {
    const mode = deriveChatSurfaceMode({
      messageCount: 3,
      isBusy: false,
      hasSubmittedFirstMessage: false,
    });

    assert.equal(mode, "conversation");
  });
});
