"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

/* ─── Ease ─── */

const easeOut = [0.16, 1, 0.3, 1] as const;

/* ─── Hex → RGB ─── */

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "255, 255, 255";
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

/* ─── Tilt state ─── */

interface TiltState {
  rotateX: number;
  rotateY: number;
  glowX: number;
  glowY: number;
}

const TILT_ZERO: TiltState = {
  rotateX: 0,
  rotateY: 0,
  glowX: 50,
  glowY: 50,
};

/* ─── Icons ─── */

function AIContextIcon({ color }: { color: string }) {
  return (
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
      <path
        d="M12 6h12l8 8v18a3 3 0 01-3 3H12a3 3 0 01-3-3V9a3 3 0 013-3z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M24 6v8h8"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line x1="14" y1="22" x2="26" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="27" x2="22" y2="27" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Sparkle */}
      <path
        d="M31 3l1.2 2.8L35 7l-2.8 1.2L31 11l-1.2-2.8L27 7l2.8-1.2z"
        fill={color}
        opacity="0.85"
      />
    </svg>
  );
}

function MCPIcon({ color }: { color: string }) {
  return (
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
      {/* Left node */}
      <circle cx="8" cy="20" r="3.5" stroke={color} strokeWidth="1.5" />
      {/* Right node */}
      <circle cx="32" cy="20" r="3.5" stroke={color} strokeWidth="1.5" />
      {/* Lines to diamond */}
      <line x1="11.5" y1="20" x2="14" y2="20" stroke={color} strokeWidth="1.5" />
      <line x1="26" y1="20" x2="28.5" y2="20" stroke={color} strokeWidth="1.5" />
      {/* Central diamond */}
      <path
        d="M20 12l8 8-8 8-8-8z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill={`${color}10`}
      />
      {/* Inner dot */}
      <circle cx="20" cy="20" r="2" fill={color} opacity="0.4" />
    </svg>
  );
}

function SkillsIcon({ color }: { color: string }) {
  return (
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
      <path
        d="M22 4L8 22h10l-2 14L30 18H20l2-14z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill={`${color}08`}
      />
    </svg>
  );
}

function ClaudeIcon({ color }: { color: string }) {
  return (
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
      {/* Sunburst rays — warm, Anthropic-inspired */}
      <circle cx="20" cy="20" r="6" fill={color} opacity="0.15" />
      <circle cx="20" cy="20" r="3" fill={color} opacity="0.35" />
      {/* Rays */}
      <line x1="20" y1="4" x2="20" y2="11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="29" x2="20" y2="36" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4" y1="20" x2="11" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="29" y1="20" x2="36" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Diagonal rays */}
      <line x1="8.7" y1="8.7" x2="13.7" y2="13.7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="26.3" y1="26.3" x2="31.3" y2="31.3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="31.3" y1="8.7" x2="26.3" y2="13.7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13.7" y1="26.3" x2="8.7" y2="31.3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChatGPTIcon({ color }: { color: string }) {
  return (
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
      {/* Hexagonal bloom / flower shape */}
      <path
        d="M20 6c1.5 0 2.8.8 3.5 2l.5.9.9-.5a4 4 0 015.5 1.5 4 4 0 01-1 4.6l-.7.6.7.6a4 4 0 011 4.6 4 4 0 01-5.5 1.5l-.9-.5-.5.9a4 4 0 01-7 0l-.5-.9-.9.5a4 4 0 01-5.5-1.5 4 4 0 011-4.6l.7-.6-.7-.6a4 4 0 01-1-4.6A4 4 0 0114.6 8l.9.5.5-.9A4 4 0 0120 6z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill={`${color}08`}
      />
      {/* Inner circle */}
      <circle cx="20" cy="20" r="4" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

const icons: Record<string, React.FC<{ color: string }>> = {
  "ai-context": AIContextIcon,
  mcp: MCPIcon,
  skills: SkillsIcon,
  claude: ClaudeIcon,
  chatgpt: ChatGPTIcon,
};

/* ─── Card ─── */

interface ConnectCardProps {
  href: string;
  title: string;
  description: string;
  icon: string;
  accentColor: string;
  comingSoon?: boolean;
  index?: number;
}

export function ConnectCard({
  href,
  title,
  description,
  icon,
  accentColor,
  comingSoon = false,
  index = 0,
}: ConnectCardProps) {
  const IconComponent = icons[icon] ?? icons["ai-context"];
  const accentRgb = hexToRgb(accentColor);

  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<TiltState>(TILT_ZERO);
  const [isHovered, setIsHovered] = useState(false);
  const [hasShimmered, setHasShimmered] = useState(false);
  const [isCoarse, setIsCoarse] = useState(false);

  useEffect(() => {
    setIsCoarse(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isCoarse || comingSoon) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setTilt({
        rotateY: (x - 0.5) * 10,
        rotateX: (0.5 - y) * 8,
        glowX: x * 100,
        glowY: y * 100,
      });
    },
    [isCoarse, comingSoon],
  );

  const handleMouseEnter = useCallback(() => {
    if (comingSoon) return;
    setIsHovered(true);
    if (!hasShimmered) setHasShimmered(true);
  }, [hasShimmered, comingSoon]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTilt(TILT_ZERO);
  }, []);

  const cardInner = (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: 0.1 + index * 0.08,
        duration: 0.5,
        ease: easeOut,
      }}
    >
      <div
        style={{ perspective: comingSoon ? undefined : "800px" }}
        className="w-full"
      >
        {/* Outer glow border wrapper */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="relative rounded-[var(--radius-md)] p-[1px]"
          style={{
            transform:
              isCoarse || comingSoon
                ? undefined
                : `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
            transition: isHovered
              ? "transform 0.1s ease-out"
              : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            background: isHovered
              ? `radial-gradient(circle at ${tilt.glowX}% ${tilt.glowY}%, rgba(${accentRgb}, 0.25) 0%, rgba(${accentRgb}, 0.06) 40%, transparent 70%)`
              : `linear-gradient(135deg, rgba(${accentRgb}, 0.04) 0%, transparent 50%)`,
          }}
        >
          {/* Inner card surface */}
          <div
            className={cn(
              "relative overflow-hidden",
              "flex flex-col gap-[var(--space-4)]",
              "p-[var(--space-5)] md:p-[var(--space-6)]",
              "rounded-[calc(var(--radius-md)-1px)]",
              "transition-shadow duration-[var(--duration-normal)]",
              comingSoon && "opacity-50",
              !comingSoon && "cursor-pointer",
            )}
            style={{ backgroundColor: "rgba(9, 9, 9, 0.85)" }}
          >
            {/* Shimmer sweep on first hover */}
            {hasShimmered && !comingSoon && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.04) 45%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 55%, transparent 70%)",
                  animation: "shimmer-sweep 0.8s ease-out forwards",
                }}
              />
            )}

            {/* "soon" badge */}
            {comingSoon && (
              <div
                className={cn(
                  "absolute top-[var(--space-4)] right-[var(--space-4)]",
                  "px-[var(--space-2)] py-[2px]",
                  "rounded-[var(--radius-full)]",
                  "text-[10px] tracking-[0.08em]",
                  "font-medium",
                  "bg-[rgba(255,255,255,0.06)]",
                  "border border-[rgba(255,255,255,0.1)]",
                  "text-[var(--agent-text-muted)]",
                )}
              >
                soon
              </div>
            )}

            {/* Icon container */}
            <div
              className={cn(
                "w-[48px] h-[48px]",
                "rounded-[var(--radius-sm)]",
                "flex items-center justify-center",
              )}
              style={{
                backgroundColor: `rgba(${accentRgb}, 0.08)`,
              }}
            >
              <IconComponent color={accentColor} />
            </div>

            {/* Text */}
            <div className="flex flex-col gap-[var(--space-1)]">
              <span
                className={cn(
                  "text-[var(--text-base)] md:text-[var(--text-lg)]",
                  "font-medium",
                  "text-[var(--agent-text-primary)]",
                )}
              >
                {title}
              </span>
              <span
                className={cn(
                  "text-[var(--text-sm)]",
                  "text-[var(--agent-text-secondary)]",
                  "leading-[var(--leading-normal)]",
                )}
              >
                {description}
              </span>
            </div>

            {/* Bottom accent glow line (visible on hover) */}
            {!comingSoon && (
              <div
                className={cn(
                  "absolute bottom-0 left-[var(--space-6)] right-[var(--space-6)]",
                  "h-[1px]",
                  "opacity-0 transition-opacity duration-[var(--duration-normal)]",
                )}
                style={{
                  background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                  opacity: isHovered ? 1 : 0,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (comingSoon) {
    return cardInner;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block no-underline"
    >
      {cardInner}
    </a>
  );
}
