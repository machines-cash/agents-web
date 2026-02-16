"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { cn } from "../../lib/utils";

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

export function LandingCard({
  href,
  title,
  description,
  icon,
  accentColor = "var(--orange)",
}: {
  href: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  accentColor?: string;
}) {
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
      if (isCoarse) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setTilt({
        rotateY: (x - 0.5) * 16,
        rotateX: (0.5 - y) * 12,
        glowX: x * 100,
        glowY: y * 100,
      });
    },
    [isCoarse],
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (!hasShimmered) setHasShimmered(true);
  }, [hasShimmered]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTilt(TILT_ZERO);
  }, []);

  // Resolve accent to rgb for gradients
  const accentRgb =
    accentColor === "var(--violet)" ? "123, 47, 255" : "255, 69, 0";

  return (
    <Link href={href} className="block group">
      <div style={{ perspective: "800px" }} className="w-full">
        {/* Outer glow border */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="relative rounded-[var(--radius-md)] p-[1px]"
          style={{
            transform: isCoarse
              ? undefined
              : `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(${isHovered ? 1.02 : 1})`,
            transition: isHovered
              ? "transform 0.1s ease-out"
              : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            background: isHovered
              ? `radial-gradient(circle at ${tilt.glowX}% ${tilt.glowY}%, rgba(${accentRgb}, 0.3) 0%, rgba(${accentRgb}, 0.08) 40%, transparent 70%)`
              : `linear-gradient(135deg, rgba(${accentRgb}, 0.06) 0%, transparent 50%)`,
          }}
        >
          {/* Inner card */}
          <div
            className={cn(
              "relative overflow-hidden",
              "flex items-center gap-[var(--space-5)]",
              "p-[var(--space-6)]",
              "rounded-[calc(var(--radius-md)-1px)]",
              "backdrop-blur-[20px]",
              "transition-shadow duration-[var(--duration-normal)]",
              "group-active:scale-[0.98]",
            )}
            style={{ backgroundColor: "rgba(9, 9, 9, 0.8)" }}
          >
            {/* Shimmer sweep */}
            {hasShimmered && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.04) 45%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 55%, transparent 70%)",
                  animation: "shimmer-sweep 0.8s ease-out forwards",
                }}
              />
            )}

            {/* Icon */}
            {icon && (
              <div
                className={cn(
                  "shrink-0 w-[44px] h-[44px] rounded-[var(--radius-sm)]",
                  "flex items-center justify-center",
                )}
                style={{ backgroundColor: `rgba(${accentRgb}, 0.1)` }}
              >
                {icon}
              </div>
            )}

            {/* Text */}
            <div className="flex-1 flex flex-col gap-[var(--space-1)] min-w-0">
              <span className="text-[var(--text-xl)] font-light tracking-[var(--tracking-tight)]">
                {title}
              </span>
              <span className="text-[var(--text-sm)] text-[var(--agent-text-secondary)]">
                {description}
              </span>
            </div>

            {/* Arrow */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--agent-text-muted)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(
                "shrink-0",
                "transition-all duration-[var(--duration-fast)]",
                "group-hover:translate-x-1",
              )}
              style={{
                stroke: isHovered ? `rgb(${accentRgb})` : undefined,
              }}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Inline icon components ─── */

export function ProcessorIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--orange)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  );
}

export function PlugIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--violet)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22v-5" />
      <path d="M9 7V2" />
      <path d="M15 7V2" />
      <path d="M6 13V8a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4Z" />
    </svg>
  );
}
