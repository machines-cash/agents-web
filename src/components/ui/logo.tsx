/* eslint-disable @next/next/no-img-element */
import { cn } from "../../lib/utils";

/**
 * MachinesMark — the actual brand mark (square logo with M letterform).
 * Uses the real brand asset from /public/brand/.
 * `rounded` controls corner rounding: "sm" for subtle, "full" for circle crop.
 */
export function MachinesMark({
  size = 48,
  rounded = "sm",
  className,
}: {
  size?: number;
  rounded?: "none" | "sm" | "md" | "full";
  className?: string;
}) {
  const radiusMap = {
    none: "rounded-none",
    sm: "rounded-[4px]",
    md: "rounded-[8px]",
    full: "rounded-full",
  } as const;

  return (
    <img
      src="/brand/machines-cash-logo.jpg"
      alt="machines"
      width={size}
      height={size}
      className={cn(
        "shrink-0 object-cover",
        radiusMap[rounded],
        className,
      )}
      draggable={false}
    />
  );
}

/**
 * MachinesWordmark — the text-based "machines" brand wordmark.
 * Uses inline SVG with configurable color.
 */
export function MachinesWordmark({
  height = 20,
  color = "var(--orange)",
  className,
}: {
  height?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      height={height}
      viewBox="315 178 875 112"
      className={cn("shrink-0", className)}
      aria-label="machines"
    >
      <g fill={color}>
        <path d="M777.5,211.5h-33v-33h-44v110h44v-49.5c0-3.04,2.46-5.5,5.5-5.5h0c3.04,0,5.5,2.46,5.5,5.5v49.5h44v-55c0-12.15-9.85-22-22-22Z" />
        <path d="M447.5,211.5h-132v77h44v-49.5c0-3.04,2.46-5.5,5.5-5.5h0c3.04,0,5.5,2.46,5.5,5.5v49.5h44v-49.5c0-3.04,2.46-5.5,5.5-5.5h0c3.04,0,5.5,2.46,5.5,5.5v49.5h44v-55c0-12.15-9.85-22-22-22Z" />
        <path d="M1135,233.5h49.5v-22h-77c-12.15,0-22,9.85-22,22s9.85,22,22,22h27.5c3.04,0,5.5,2.46,5.5,5.5s-2.46,5.5-5.5,5.5h-49.5v22h77c12.15,0,22-9.85,22-22h0c0-12.15-9.85-22-22-22h-27.5c-3.04,0-5.5-2.46-5.5-5.5s2.46-5.5,5.5-5.5Z" />
        <rect x="810.5" y="211.5" width="44" height="77" />
        <path d="M942.5,211.5h-77v77h44v-49.5c0-3.04,2.46-5.5,5.5-5.5h0c3.04,0,5.5,2.46,5.5,5.5v49.5h44v-55c0-12.15-9.85-22-22-22Z" />
        <path d="M667.5,211.5h-55c-12.15,0-22,9.85-22,22v33c0,12.15,9.85,22,22,22h55c12.15,0,22-9.85,22-22v-11h-44v5.5c0,3.04-2.46,5.5-5.5,5.5s-5.5-2.46-5.5-5.5v-22c0-3.04,2.46-5.5,5.5-5.5s5.5,2.46,5.5,5.5v5.5h44v-11c0-12.15-9.85-22-22-22Z" />
        <path d="M1052.5,211.5h-55c-12.15,0-22,9.85-22,22v33c0,12.15,9.85,22,22,22h77v-22h-45.7c-5.14,0-9.3-4.17-9.3-9.3v-1.7h55v-22c0-12.15-9.85-22-22-22ZM1025.24,244.5h-.47c-2.91,0-5.26-2.36-5.26-5.26h0c0-2.87,2.1-5.44,4.96-5.71,3.28-.31,6.04,2.26,6.04,5.47v.24c0,2.91-2.36,5.26-5.26,5.26Z" />
        <path d="M557.5,211.5h-77v22h49.5c3.04,0,5.5,2.46,5.5,5.5h0c0,3.04-2.46,5.5-5.5,5.5h-27.5c-12.15,0-22,9.85-22,22h0c0,12.15,9.85,22,22,22h11s11,0,11,0h33c12.15,0,22-9.85,22-22v-33c0-12.15-9.85-22-22-22ZM535.5,261c0,3.22-2.76,5.79-6.04,5.47-2.86-.27-4.96-2.84-4.96-5.71h0c0-2.91,2.36-5.26,5.26-5.26h.24c3.04,0,5.5,2.46,5.5,5.5h0Z" />
      </g>
    </svg>
  );
}
