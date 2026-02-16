"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
  type PanInfo,
} from "framer-motion";
import { cn } from "../../lib/utils";

/**
 * Slide-to-confirm gesture — mimics the iOS "Confirm with Side Button" area
 * but adapted as a swipeable track for web.
 *
 * 60px tall track, 52px thumb, Apple system gray + orange accent.
 */
export function SlideToConfirm({
  onConfirm,
  disabled = false,
  label = "slide to pay",
}: {
  onConfirm: () => void;
  disabled?: boolean;
  label?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const controls = useAnimation();
  const [confirmed, setConfirmed] = useState(false);
  const [maxDrag, setMaxDrag] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (trackRef.current) {
        setMaxDrag(trackRef.current.offsetWidth - 52 - 8);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  /* Motion transforms */
  const textOpacity = useTransform(x, [0, maxDrag * 0.35], [1, 0]);
  const trackFillWidth = useTransform(x, [0, maxDrag], [56, maxDrag + 56]);
  const thumbScale = useTransform(x, [maxDrag * 0.85, maxDrag], [1, 1.06]);

  const handleDragEnd = useCallback(
    (_: unknown, _info: PanInfo) => {
      if (disabled || confirmed || maxDrag <= 0) return;

      const currentX = x.get();
      const threshold = maxDrag * 0.8;

      if (currentX >= threshold) {
        setConfirmed(true);
        void controls
          .start({ x: maxDrag }, { type: "spring", stiffness: 400, damping: 25 })
          .then(() => onConfirm());
      } else {
        void controls.start({ x: 0 }, { type: "spring", stiffness: 500, damping: 35 });
      }
    },
    [disabled, confirmed, maxDrag, x, controls, onConfirm],
  );

  return (
    <div
      ref={trackRef}
      className={cn(
        "relative h-[60px] w-full rounded-full overflow-hidden select-none",
        disabled && "opacity-40 pointer-events-none",
      )}
      style={{
        /* iOS systemGray6-like dark track */
        background: "rgba(28, 28, 30, 0.8)",
        border: "0.5px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Track fill — subtle glow following thumb */}
      <motion.div
        className="absolute top-0 left-0 bottom-0 rounded-full"
        style={{
          width: trackFillWidth,
          background: "linear-gradient(90deg, rgba(255,69,0,0.12) 0%, rgba(255,69,0,0.04) 100%)",
        }}
      />

      {/* Label with cascading chevrons */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none gap-[6px]"
        style={{ opacity: textOpacity }}
      >
        {/* Three cascading chevrons */}
        <div className="flex items-center gap-[2px] mr-[6px]">
          {[0, 1, 2].map((i) => (
            <svg key={i} width="8" height="12" viewBox="0 0 8 12" fill="none" className={`chevron-${i + 1}`}>
              <path d="M1.5 1L6.5 6L1.5 11" stroke="rgba(235,235,245,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ))}
        </div>
        <span className="text-[15px] text-[rgba(235,235,245,0.4)] font-normal">
          {label}
        </span>
      </motion.div>

      {/* Draggable thumb */}
      <motion.div
        className={cn(
          "absolute top-[4px] left-[4px]",
          "w-[52px] h-[52px] rounded-full",
          "bg-[var(--orange)]",
          "flex items-center justify-center",
          "cursor-grab active:cursor-grabbing",
          "z-10",
        )}
        style={{
          x,
          scale: thumbScale,
          boxShadow: "0 2px 12px rgba(255,69,0,0.35), 0 0 0 0.5px rgba(255,255,255,0.1) inset",
        }}
        drag={confirmed ? false : "x"}
        dragConstraints={{ left: 0, right: maxDrag }}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        animate={controls}
      >
        {confirmed ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        )}
      </motion.div>
    </div>
  );
}
