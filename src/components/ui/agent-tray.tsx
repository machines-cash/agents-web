"use client";

import {
  motion,
  AnimatePresence,
  useMotionValue,
  type PanInfo,
} from "framer-motion";
import { useEffect, useCallback, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";
import { useIsMobile } from "../../hooks/use-is-mobile";

/* ─── Body scroll lock (ref-counted for nested trays) ─── */

let activeTrayCount = 0;
let lockedScrollY = 0;

function lockBodyScroll() {
  if (typeof window === "undefined") return;
  if (activeTrayCount === 0) {
    lockedScrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
  }
  activeTrayCount += 1;
}

function unlockBodyScroll() {
  if (typeof window === "undefined") return;
  activeTrayCount = Math.max(0, activeTrayCount - 1);
  if (activeTrayCount === 0) {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    document.body.style.overflow = "";
    window.scrollTo(0, lockedScrollY);
  }
}

/* ─── Types ─── */

export interface AgentTrayProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Height mode: auto fits content, medium/large are viewport fractions */
  height?: "auto" | "medium" | "large";
  /** Show the drag handle bar on mobile (default: true) */
  showHandle?: boolean;
  /** Override z-index (default: 60) */
  zIndex?: number;
  /** Whether the tray can be dismissed via backdrop/escape/drag (default: true) */
  dismissible?: boolean;
  /** Additional className for the tray surface */
  className?: string;
  /** Additional className for the scrollable content area */
  contentClassName?: string;
}

/* ─── Component ─── */

export function AgentTray({
  open,
  onClose,
  children,
  height = "auto",
  showHandle = true,
  zIndex = 60,
  dismissible = true,
  className,
  contentClassName,
}: AgentTrayProps) {
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const y = useMotionValue(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== "undefined"
      ? window.visualViewport?.height ?? window.innerHeight
      : 800,
  );

  const calculatedHeight = useMemo(() => {
    if (height === "large") return viewportHeight * 0.95;
    if (height === "medium") return viewportHeight * 0.5;
    return undefined;
  }, [height, viewportHeight]);

  // Track mounted for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Track viewport height
  useEffect(() => {
    if (!open) return;

    setViewportHeight(window.visualViewport?.height ?? window.innerHeight);

    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      setViewportHeight(vv.height);
    };

    vv.addEventListener("resize", handleResize);
    return () => vv.removeEventListener("resize", handleResize);
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open || !dismissible) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, dismissible, onClose]);

  // Drag end (mobile only)
  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (!dismissible) return;
      if (info.offset.y > 100) {
        onClose();
      }
    },
    [dismissible, onClose],
  );

  // Backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (!dismissible) return;
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [dismissible, onClose],
  );

  if (!mounted) return null;

  const maxHeight = isMobile ? viewportHeight * 0.85 : viewportHeight * 0.9;
  const showDragHandle = showHandle && dismissible && isMobile;

  const trayContent = (
    <AnimatePresence>
      {open && (
        <>
          {/* ─── Backdrop ─── */}
          <motion.div
            className="fixed inset-0"
            style={{
              zIndex,
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              backgroundColor: isMobile
                ? "rgba(0, 0, 0, 0.5)"
                : "rgba(0, 0, 0, 0.4)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
          >
            {isMobile ? (
              /* ─── Mobile: Bottom sheet ─── */
              <motion.div
                className={cn(
                  "absolute left-0 right-0 bottom-0",
                  "bg-[var(--agent-bg)] border-t border-[var(--agent-border)]",
                  "overflow-hidden flex flex-col",
                  className,
                )}
                style={{
                  borderTopLeftRadius: "var(--radius-lg)",
                  borderTopRightRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow-lg)",
                  y,
                  height: calculatedHeight ?? "auto",
                  maxHeight,
                  paddingBottom: "env(safe-area-inset-bottom, 0px)",
                  willChange: "transform",
                }}
                drag={dismissible ? "y" : false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={handleDragEnd}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                onClick={(e) => e.stopPropagation()}
              >
                {showDragHandle && (
                  <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                    <div className="w-10 h-1 rounded-full bg-[var(--agent-border-strong)]" />
                  </div>
                )}

                <div
                  ref={contentRef}
                  className={cn(
                    "overflow-y-auto overflow-x-hidden",
                    height !== "auto" && "flex-1 min-h-0",
                    contentClassName,
                  )}
                  style={{
                    maxHeight:
                      height === "auto" ? maxHeight - 40 : undefined,
                    WebkitOverflowScrolling: "touch",
                    overscrollBehavior: "contain",
                  }}
                >
                  {children}
                </div>
              </motion.div>
            ) : (
              /* ─── Desktop: Centered modal ─── */
              <div
                className="fixed inset-0 flex items-center justify-center"
                style={{ zIndex: zIndex + 1 }}
                onClick={handleBackdropClick}
              >
                <motion.div
                  className={cn(
                    "w-full max-w-[480px] mx-[var(--space-4)]",
                    "bg-[var(--agent-bg)] border border-[var(--agent-border)]",
                    "overflow-hidden flex flex-col",
                    className,
                  )}
                  style={{
                    borderRadius: "var(--radius-md)",
                    boxShadow: "var(--shadow-lg)",
                    maxHeight,
                    willChange: "transform, opacity",
                  }}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{
                    duration: 0.2,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    ref={contentRef}
                    className={cn(
                      "overflow-y-auto overflow-x-hidden",
                      height !== "auto" && "flex-1 min-h-0",
                      contentClassName,
                    )}
                    style={{
                      maxHeight: height === "auto" ? maxHeight - 16 : undefined,
                      overscrollBehavior: "contain",
                    }}
                  >
                    {children}
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(trayContent, document.body);
}
