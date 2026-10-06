import { cn } from "@/lib/utils";
import { IAllStatus } from "../Table/Cells/StatusCell";

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: IAllStatus | "default";
  showValue?: boolean;
  showPercentage?: boolean;
  label?: string;
  className?: string;
}

const variantColors = {
  backlog: "var(--color-primary)",
  todo: "var(--color-yellow-500)",
  in_progress: "var(--color-orange-500)",
  in_review: "var(--color-purple-500)",
  done: "var(--color-verdigris-500)",
  completed: "var(--color-green-500)",
  on_hold: "var(--color-orange-500)",
  cancelled: "var(--color-red-500)",
  default: "var(--color-primary)",
  pending: "var(--color-gray-500)",
  new: "var(--color-blue-500)",
  paid: "var(--color-green-600)",
  unpaid: "var(--color-red-500)",
  approved: "var(--color-green-500)",
  rejected: "var(--color-red-500)",
  open: "var(--color-green-500)",
  closed: "var(--color-red-500)",
  active: "var(--color-green-500)",
  inactive: "var(--color-red-500)",
  partially_filled: "var(--color-orange-500)",
  failed: "var(--color-red-600)",
};

function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  variant = "default",
  showValue = false,
  showPercentage = true,
  label,
  className,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const percentageFontSize = Math.max(size * 0.15, 12); // Scales with size, minimum 12px
  const valueFontSize = Math.max(size * 0.08, 10); // Scales with size, minimum 10px
  const labelFontSize = Math.max(size * 0.1, 12); // Scales with size, minimum 12px

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--ot-line)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={variantColors[variant]}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center ">
          {showPercentage && (
            <span
              className=" text-fg-muted "
              style={{ fontSize: `${percentageFontSize}px` }}
            >
              {Math.round(percentage)}%
            </span>
          )}
          {showValue && (
            <span
              className="text-fg-subtle"
              style={{ fontSize: `${valueFontSize}px` }}
            >
              {value}/{max}
            </span>
          )}
        </div>
      </div>

      {label && (
        <span
          className="mt-2 font-medium text-fg-muted"
          style={{ fontSize: `${labelFontSize}px` }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

export default CircularProgress;
