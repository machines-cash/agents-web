"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import type { AgentCatalogItem } from "@/contracts";
import { cn } from "../../lib/utils";

/* ─── Motion config ─── */

const easeOut = [0.16, 1, 0.3, 1] as const;

/* ─── Product image with shimmer + fallback ─── */

function ProductImage({ src, alt }: { src: string | null; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const showPlaceholder = !src || error || !loaded;

  return (
    <div className={cn(
      "relative aspect-square overflow-hidden",
      "m-[6px] rounded-[14px]",
      "bg-[rgba(255,255,255,0.08)]",
    )}>
      {/* Shimmer placeholder */}
      {showPlaceholder && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute inset-0 overflow-hidden rounded-[10px]">
            <div
              className="absolute inset-0 -translate-x-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)",
                animation: "shimmer-sweep 1.5s infinite",
              }}
            />
          </div>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--agent-text-muted)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-40"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </div>
      )}

      {src && !error && (
        <motion.img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full object-contain"
        />
      )}
    </div>
  );
}

/* ─── Star rating ─── */

function StarRating({
  rating,
  count,
}: {
  rating: number;
  count: number | null;
}) {
  return (
    <div className="flex items-center gap-[3px]">
      <div className="flex" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill={star <= Math.round(rating) ? "var(--orange)" : "none"}
            stroke={
              star <= Math.round(rating)
                ? "var(--orange)"
                : "var(--agent-text-muted)"
            }
            strokeWidth="2"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
      {count !== null && (
        <span className="text-[var(--text-xs)] text-[var(--agent-text-muted)] leading-none opacity-60">
          {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
        </span>
      )}
    </div>
  );
}

/* ─── Individual product card — glass style ─── */

function ProductCard({
  item,
  index,
  onBuy,
}: {
  item: AgentCatalogItem;
  index: number;
  onBuy?: (item: AgentCatalogItem) => void;
}) {
  const [hasHovered, setHasHovered] = useState(false);

  const handleBuy = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onBuy?.(item);
    },
    [item, onBuy],
  );

  return (
    <motion.a
      href={item.url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.08,
        duration: 0.5,
        ease: easeOut,
      }}
      whileHover={{
        y: -4,
        scale: 1.02,
        transition: { type: "spring", stiffness: 300, damping: 20 },
      }}
      whileTap={{ scale: 0.97 }}
      onMouseEnter={() => setHasHovered(true)}
      className={cn(
        "relative flex-shrink-0 w-[176px] flex flex-col",
        "rounded-[var(--radius-md)] overflow-hidden",
        "backdrop-blur-[20px] [-webkit-backdrop-filter:blur(20px)]",
        "bg-[rgba(255,255,255,0.05)]",
        "border border-[rgba(255,255,255,0.10)]",
        "cursor-pointer",
        "no-underline",
        "transition-shadow duration-300",
        "hover:shadow-[0_8px_32px_rgba(255,69,0,0.08),0_0_0_1px_rgba(255,255,255,0.14)]",
      )}
    >
      {/* Ambient top glow — liquid glass lighting */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[var(--radius-md)]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.06) 0%, transparent 60%)",
        }}
      />

      {/* Hover shine overlay — one-shot diagonal sweep */}
      {hasHovered && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 55%, transparent 70%)",
            animation: "card-shine 0.7s ease-out forwards",
          }}
        />
      )}

      {/* Product image */}
      <ProductImage src={item.imageUrl} alt={item.title} />

      {/* Card body */}
      <div className="flex flex-col gap-[6px] px-[10px] pt-[8px] pb-[10px] flex-1">
        {/* Title — 2 lines max, subdued */}
        <p
          className={cn(
            "text-[13px] text-[var(--agent-text-secondary)]",
            "leading-[1.3] line-clamp-2",
            "min-h-[2.2em]",
            "font-normal tracking-[0.01em]",
          )}
        >
          {item.title}
        </p>

        {/* Rating */}
        {item.rating !== null && (
          <StarRating rating={item.rating} count={item.reviewCount} />
        )}

        {/* Price — gradient white-to-violet */}
        {item.price && (
          <span
            className="text-[var(--text-base)] font-semibold mt-[2px]"
            style={{
              background: "linear-gradient(135deg, var(--white) 0%, var(--violet) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {item.price}
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Buy button — solid orange CTA */}
        <button
          type="button"
          onClick={handleBuy}
          className={cn(
            "w-full h-[28px] flex items-center justify-center",
            "rounded-[var(--radius-full)] mt-[6px]",
            "bg-[var(--orange)] text-white",
            "text-[11px] font-medium",
            "tracking-[0.04em]",
            "transition-all duration-200",
            "hover:brightness-110 hover:shadow-[0_2px_12px_rgba(255,69,0,0.3)]",
            "active:brightness-90 active:scale-[0.97]",
          )}
        >
          buy
        </button>
      </div>
    </motion.a>
  );
}

/* ─── Main carousel ─── */

export function ProductCatalogCarousel({
  items,
  onBuy,
}: {
  items: AgentCatalogItem[];
  onBuy?: (item: AgentCatalogItem) => void;
}) {
  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: easeOut }}
      className="mb-[var(--space-3)]"
    >
      <div
        className={cn(
          "flex gap-[12px]",
          "overflow-x-auto hide-scrollbar",
          "pb-[var(--space-1)]",
          "snap-x snap-mandatory",
        )}
      >
        {items.map((item, index) => (
          <div key={item.asin ?? item.url ?? index} className="snap-start">
            <ProductCard item={item} index={index} onBuy={onBuy} />
          </div>
        ))}
        {/* Trailing spacer */}
        <div className="flex-shrink-0 w-[12px]" aria-hidden="true" />
      </div>
    </motion.div>
  );
}
