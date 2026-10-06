import { Check } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

export type WizardStepStatus = "active" | "done" | "pending";

export interface WizardStepProps {
  /** 1-based step number shown inside the indicator */
  step: number;
  /** Small secondary label, e.g. "Step 1 of 7" */
  label: string;
  /** Primary step name, e.g. "Personal Information" */
  title: string;
  status: WizardStepStatus;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

// SVG ring for active step (~270° accent arc, matches original layout)
const ARC_R = 10;
const ARC_CIRCUMFERENCE = 2 * Math.PI * ARC_R;
const ACTIVE_RING_PERCENT = 75;

function StepIndicator({
  step,
  status,
}: {
  step: number;
  status: WizardStepStatus;
}) {
  if (status === "done") {
    return (
      <div className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-success-solid">
        <Check className="size-3.5 text-white" strokeWidth={3} />
      </div>
    );
  }

  if (status === "active") {
    const arcLength = (ACTIVE_RING_PERCENT / 100) * ARC_CIRCUMFERENCE;
    const arcGap = ARC_CIRCUMFERENCE - arcLength;

    return (
      <div className="relative size-[30px] shrink-0">
        <svg
          className="absolute inset-0 size-full -rotate-90"
          viewBox="0 0 30 30"
          aria-hidden
        >
          <circle
            cx="15"
            cy="15"
            r={ARC_R}
            fill="none"
            stroke="var(--ot-line)"
            strokeWidth="2"
          />
          <circle
            cx="15"
            cy="15"
            r={ARC_R}
            fill="none"
            stroke="var(--ot-success-solid)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${arcGap}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-[19px] items-center justify-center rounded-full bg-brand-subtle text-[11px] font-medium leading-none text-fg">
            {step}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative size-[30px] shrink-0 overflow-hidden rounded-full">
      <div className="absolute inset-[3px] rounded-full bg-line" />
      <div className="absolute inset-[5px] rounded-full bg-sunken" />
    </div>
  );
}

/**
 * A single step item for a multi-step wizard sidebar.
 */
export function WizardStep({
  step,
  label,
  title,
  status,
  onClick,
  disabled = false,
  className,
}: WizardStepProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 rounded-[6px] p-[10px] text-start transition-colors",
        status === "pending" && !disabled && "hover:bg-hover",
        status === "done" && "hover:bg-hover",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <StepIndicator step={step} status={status} />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm leading-[18px] text-fg-muted">{label}</span>
        <span
          className={cn(
            "text-base leading-5",
            status === "active"
              ? "font-medium text-success"
              : "font-normal text-fg",
          )}
        >
          {title}
        </span>
      </div>
    </button>
  );
}
