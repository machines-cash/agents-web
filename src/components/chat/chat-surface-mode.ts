export type ChatSurfaceMode = "empty" | "conversation";

export function deriveChatSurfaceMode(options: {
  messageCount: number;
  isBusy: boolean;
  hasSubmittedFirstMessage: boolean;
}): ChatSurfaceMode {
  if (options.hasSubmittedFirstMessage) {
    return "conversation";
  }

  if (options.messageCount > 0) {
    return "conversation";
  }

  if (options.isBusy) {
    return "conversation";
  }

  return "empty";
}
