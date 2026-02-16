"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useCallback } from "react";
import { cn } from "../../lib/utils";

function clampToUnit(value: number) {
  if (value > 1) return 1;
  if (value < -1) return -1;
  return value;
}

export function PremiumHeroMark({
  size = "clamp(96px, 18vw, 148px)",
  onClick,
  className,
}: {
  size?: number | string;
  onClick?: () => void;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const rotateX = useSpring(useTransform(pointerY, [-1, 1], [7, -7]), {
    stiffness: 180,
    damping: 24,
    mass: 0.6,
  });
  const rotateY = useSpring(useTransform(pointerX, [-1, 1], [-7, 7]), {
    stiffness: 180,
    damping: 24,
    mass: 0.6,
  });
  const frontOffsetX = useSpring(useTransform(pointerX, [-1, 1], [-2, 2]), {
    stiffness: 220,
    damping: 28,
    mass: 0.55,
  });
  const frontOffsetY = useSpring(useTransform(pointerY, [-1, 1], [-2, 2]), {
    stiffness: 220,
    damping: 28,
    mass: 0.55,
  });

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (prefersReducedMotion) return;
      if (event.pointerType && event.pointerType !== "mouse") return;
      const rect = event.currentTarget.getBoundingClientRect();
      const normalizedX = clampToUnit(
        ((event.clientX - rect.left) / rect.width - 0.5) * 2,
      );
      const normalizedY = clampToUnit(
        ((event.clientY - rect.top) / rect.height - 0.5) * 2,
      );
      pointerX.set(normalizedX);
      pointerY.set(normalizedY);
    },
    [pointerX, pointerY, prefersReducedMotion],
  );

  const handlePointerLeave = useCallback(() => {
    pointerX.set(0);
    pointerY.set(0);
  }, [pointerX, pointerY]);

  return (
    <motion.button
      type="button"
      className={cn(
        "relative isolate select-none bg-transparent border-0 p-0",
        onClick ? "cursor-pointer" : "cursor-default",
        className,
      )}
      style={{
        width: size,
        height: size,
        perspective: 980,
      }}
      initial={{ opacity: 0, scale: 0.94, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
      onClick={onClick}
      aria-label={onClick ? "log in" : undefined}
    >
      <motion.div
        className="relative h-full w-full"
        style={{
          rotateX: prefersReducedMotion ? 0 : rotateX,
          rotateY: prefersReducedMotion ? 0 : rotateY,
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        <div
          className="absolute inset-[6%] rounded-[26%]"
          style={{
            transform: "translateY(10px) scale(0.95)",
            background:
              "linear-gradient(155deg, rgba(255, 111, 48, 0.7), rgba(180, 48, 0, 0.5) 44%, rgba(55, 20, 5, 0.72))",
            filter: "blur(2px)",
            opacity: 0.8,
          }}
        />

        <motion.img
          src="/brand/machines-cash-logo.svg"
          alt="machines"
          draggable={false}
          className="relative h-full w-full rounded-[22%] object-cover"
          style={{
            x: prefersReducedMotion ? 0 : frontOffsetX,
            y: prefersReducedMotion ? 0 : frontOffsetY,
            filter:
              "drop-shadow(0 16px 26px rgba(0, 0, 0, 0.45))",
            willChange: "transform",
          }}
        />
      </motion.div>
    </motion.button>
  );
}
