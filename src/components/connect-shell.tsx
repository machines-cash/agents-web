"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AgentHeader } from "./layout/agent-header";
import { ConnectCard } from "./connect/connect-card";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

const easeOut = [0.16, 1, 0.3, 1] as const;

const resources = [
  {
    title: "ai context file",
    description: "give any ai agent full context about machines protocol.",
    href: "https://docs.machines.cash/ai-context-file",
    icon: "ai-context",
    accentColor: "#7B2FFF",
    comingSoon: false,
  },
  {
    title: "mcp server",
    description: "connect your ai tools directly to machines via mcp.",
    href: "https://docs.machines.cash/mcp",
    icon: "mcp",
    accentColor: "#0066FF",
    comingSoon: false,
  },
  {
    title: "agent skills",
    description: "teach any ai agent new capabilities with skill packs.",
    href: "https://docs.machines.cash/agent-skills",
    icon: "skills",
    accentColor: "#FF4500",
    comingSoon: false,
  },
  {
    title: "claude bot",
    description: "connect claude as your ai agent.",
    href: "#",
    icon: "claude",
    accentColor: "#D4714E",
    comingSoon: true,
  },
  {
    title: "chatgpt app",
    description: "connect chatgpt as your ai agent.",
    href: "#",
    icon: "chatgpt",
    accentColor: "#10A37F",
    comingSoon: true,
  },
];

export function ConnectShell() {
  return (
    <div className="flex flex-col h-[calc(var(--agent-vh,1vh)*100)]">
      <AgentHeader session={null} />

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <div
          className={cn(
            "w-full max-w-[var(--container-lg)] mx-auto",
            "px-[var(--space-4)] md:px-[var(--space-8)]",
            "py-[var(--space-8)] md:py-[var(--space-12)]",
          )}
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="flex flex-col gap-[var(--space-3)] mb-[var(--space-10)] md:mb-[var(--space-12)]"
          >
            <h1
              className={cn(
                "text-[var(--display-md)] md:text-[var(--display-lg)]",
                "font-light tracking-[var(--tracking-tight)]",
              )}
            >
              connect your ai
            </h1>
            <p className="text-[var(--text-lg)] md:text-[var(--text-xl)] text-[var(--agent-text-secondary)] max-w-[480px]">
              integrate agents, tools, and context with machines protocol
            </p>
          </motion.div>

          {/* Row 1: 3 cards */}
          <div
            className={cn(
              "grid gap-[var(--space-5)] md:gap-[var(--space-6)]",
              "grid-cols-1 md:grid-cols-3",
            )}
          >
            {resources.slice(0, 3).map((resource, index) => (
              <ConnectCard
                key={resource.title}
                href={resource.href}
                title={resource.title}
                description={resource.description}
                icon={resource.icon}
                accentColor={resource.accentColor}
                comingSoon={resource.comingSoon}
                index={index}
              />
            ))}
          </div>

          {/* Row 2: 2 cards, centered */}
          <div
            className={cn(
              "grid gap-[var(--space-5)] md:gap-[var(--space-6)]",
              "grid-cols-1 md:grid-cols-2",
              "md:max-w-[calc(66.666%+var(--space-3))] mx-auto",
              "mt-[var(--space-5)] md:mt-[var(--space-6)]",
            )}
          >
            {resources.slice(3).map((resource, index) => (
              <ConnectCard
                key={resource.title}
                href={resource.href}
                title={resource.title}
                description={resource.description}
                icon={resource.icon}
                accentColor={resource.accentColor}
                comingSoon={resource.comingSoon}
                index={index + 3}
              />
            ))}
          </div>

          {/* Footer link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4, ease: easeOut }}
            className="mt-[var(--space-10)] md:mt-[var(--space-12)]"
          >
            <Link href="/machines">
              <Button variant="ghost" size="sm">
                machines agent &rarr;
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
