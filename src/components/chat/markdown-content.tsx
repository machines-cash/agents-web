"use client";

import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

/* ─── Inline formatting ─── */

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Inline code: `text`
    const codeMatch = remaining.match(/`([^`]+)`/);

    // Find the earliest match
    const boldIdx = boldMatch?.index ?? Infinity;
    const codeIdx = codeMatch?.index ?? Infinity;

    if (boldIdx === Infinity && codeIdx === Infinity) {
      // No more formatting — push rest as text
      parts.push(remaining);
      break;
    }

    if (boldIdx <= codeIdx && boldMatch) {
      // Bold comes first
      if (boldIdx > 0) {
        parts.push(remaining.slice(0, boldIdx));
      }
      parts.push(
        <strong
          key={`b-${key++}`}
          className="font-semibold text-[var(--agent-text-primary)]"
        >
          {boldMatch[1]}
        </strong>,
      );
      remaining = remaining.slice(boldIdx + boldMatch[0].length);
    } else if (codeMatch) {
      // Code comes first
      if (codeIdx > 0) {
        parts.push(remaining.slice(0, codeIdx));
      }
      parts.push(
        <code
          key={`c-${key++}`}
          className={cn(
            "px-[4px] py-[1px] rounded-[4px]",
            "bg-[var(--agent-surface-elevated)]",
            "font-mono text-[var(--text-sm)]",
          )}
        >
          {codeMatch[1]}
        </code>,
      );
      remaining = remaining.slice(codeIdx + codeMatch[0].length);
    }
  }

  return parts;
}

/* ─── Block detection ─── */

type Block =
  | { type: "paragraph"; lines: string[] }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[] };

function parseBlocks(content: string): Block[] {
  // Split on double newlines for paragraph-level blocks
  const rawBlocks = content.split(/\n\n+/).filter((b) => b.trim());
  const blocks: Block[] = [];

  for (const raw of rawBlocks) {
    const lines = raw.split("\n").filter((l) => l.trim());

    // Check if all lines are unordered list items
    const isUnorderedList = lines.every((l) => /^\s*[-*]\s+/.test(l));
    if (isUnorderedList && lines.length > 0) {
      blocks.push({
        type: "unordered-list",
        items: lines.map((l) => l.replace(/^\s*[-*]\s+/, "")),
      });
      continue;
    }

    // Check if all lines are ordered list items
    const isOrderedList = lines.every((l) => /^\s*\d+[.)]\s+/.test(l));
    if (isOrderedList && lines.length > 0) {
      blocks.push({
        type: "ordered-list",
        items: lines.map((l) => l.replace(/^\s*\d+[.)]\s+/, "")),
      });
      continue;
    }

    // Mixed content — check if it starts with text then transitions to a list
    // This handles: "here are your transactions:\n- item1\n- item2"
    const firstListIdx = lines.findIndex((l) => /^\s*[-*]\s+/.test(l));
    const firstOrdListIdx = lines.findIndex((l) => /^\s*\d+[.)]\s+/.test(l));

    if (firstListIdx > 0 && lines.slice(firstListIdx).every((l) => /^\s*[-*]\s+/.test(l))) {
      // Text paragraph followed by unordered list
      blocks.push({
        type: "paragraph",
        lines: lines.slice(0, firstListIdx),
      });
      blocks.push({
        type: "unordered-list",
        items: lines.slice(firstListIdx).map((l) => l.replace(/^\s*[-*]\s+/, "")),
      });
      continue;
    }

    if (firstOrdListIdx > 0 && lines.slice(firstOrdListIdx).every((l) => /^\s*\d+[.)]\s+/.test(l))) {
      // Text paragraph followed by ordered list
      blocks.push({
        type: "paragraph",
        lines: lines.slice(0, firstOrdListIdx),
      });
      blocks.push({
        type: "ordered-list",
        items: lines.slice(firstOrdListIdx).map((l) => l.replace(/^\s*\d+[.)]\s+/, "")),
      });
      continue;
    }

    // Plain paragraph
    blocks.push({ type: "paragraph", lines });
  }

  return blocks;
}

/* ─── Component ─── */

export function MarkdownContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const blocks = parseBlocks(content);

  return (
    <div className={cn("flex flex-col gap-[var(--space-3)]", className)}>
      {blocks.map((block, i) => {
        if (block.type === "unordered-list") {
          return (
            <ul
              key={i}
              className={cn(
                "list-disc pl-[var(--space-5)]",
                "space-y-[var(--space-1)]",
                "marker:text-[var(--agent-text-muted)]",
              )}
            >
              {block.items.map((item, j) => (
                <li key={j} className="text-[var(--agent-text-primary)] pl-[var(--space-1)]">
                  {renderInline(item)}
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "ordered-list") {
          return (
            <ol
              key={i}
              className={cn(
                "list-decimal pl-[var(--space-5)]",
                "space-y-[var(--space-1)]",
                "marker:text-[var(--agent-text-muted)]",
              )}
            >
              {block.items.map((item, j) => (
                <li key={j} className="text-[var(--agent-text-primary)] pl-[var(--space-1)]">
                  {renderInline(item)}
                </li>
              ))}
            </ol>
          );
        }

        // Paragraph
        return (
          <p key={i}>
            {block.lines.map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {renderInline(line)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
