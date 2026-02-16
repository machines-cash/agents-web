"use client";

/**
 * Compact card art — a miniaturized version of the Machines virtual card.
 * Dark matte surface with gold chip + subtle holographic edge, brand "m".
 * Sized at 40×26 by default — proportional to a real card (1.586:1 ratio).
 */
export function CardIcon({ width = 40 }: { width?: number }) {
  const height = Math.round(width * 0.65);
  // Unique ID per instance to avoid gradient conflicts
  const uid = `mc-${width}`;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 40 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Card body — dark matte with slight warm undertone */}
      <rect width="40" height="26" rx="5" fill={`url(#${uid}-bg)`} />
      {/* Holographic edge highlight — top + left */}
      <rect
        x="0.5"
        y="0.5"
        width="39"
        height="25"
        rx="4.5"
        fill="none"
        stroke={`url(#${uid}-edge)`}
        strokeWidth="0.5"
      />
      {/* EMV chip — gold with contact lines */}
      <rect x="6" y="9.5" width="7" height="5.5" rx="1.2" fill="rgba(212,175,55,0.5)" />
      <rect x="6" y="9.5" width="7" height="5.5" rx="1.2" fill="none" stroke="rgba(212,175,55,0.3)" strokeWidth="0.4" />
      <line x1="6" y1="12.25" x2="13" y2="12.25" stroke="rgba(212,175,55,0.22)" strokeWidth="0.35" />
      <line x1="9.5" y1="9.5" x2="9.5" y2="15" stroke="rgba(212,175,55,0.15)" strokeWidth="0.35" />
      {/* Brand mark — stylized lowercase "m" */}
      <text
        x="30"
        y="19.5"
        fontSize="8"
        fontWeight="700"
        fill="rgba(255,255,255,0.18)"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.02em"
      >
        m
      </text>
      <defs>
        {/* Card body gradient — very dark charcoal with warm shift */}
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="40" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2C2C2E" />
          <stop offset="45%" stopColor="#1C1C1E" />
          <stop offset="100%" stopColor="#141414" />
        </linearGradient>
        {/* Edge highlight — holographic-ish shimmer */}
        <linearGradient id={`${uid}-edge`} x1="0" y1="0" x2="40" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="30%" stopColor="rgba(255,255,255,0.04)" />
          <stop offset="70%" stopColor="rgba(255,255,255,0.02)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.10)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
