import { cn } from "../../lib/utils";

const sizes = {
  sm: { width: 16, height: 16, barWidth: 2, barHeight: 4.5 },
  md: { width: 24, height: 24, barWidth: 2.5, barHeight: 6 },
  lg: { width: 32, height: 32, barWidth: 3, barHeight: 8 },
} as const;

export function Spinner({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { width, height, barWidth, barHeight } = sizes[size];
  const bars = Array.from({ length: 8 }, (_, i) => i);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      className={cn("inline-block", className)}
      role="status"
      aria-label="loading"
    >
      {bars.map((i) => (
        <rect
          key={i}
          x={12 - barWidth / 2}
          y={2}
          width={barWidth}
          height={barHeight}
          rx={barWidth / 2}
          fill="currentColor"
          opacity={0.15}
          transform={`rotate(${i * 45} 12 12)`}
          style={{
            animation: `spinner-fade 0.8s linear ${i * 0.1}s infinite`,
          }}
        />
      ))}
    </svg>
  );
}
