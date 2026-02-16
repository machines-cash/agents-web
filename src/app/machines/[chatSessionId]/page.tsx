import { MachinesAgentShell } from "@/components/machines-agent-shell";

export default async function MachinesAgentSessionPage({
  params,
}: {
  params: Promise<{ chatSessionId: string }>;
}) {
  const resolved = await params;
  return <MachinesAgentShell initialChatSessionId={resolved.chatSessionId} />;
}
