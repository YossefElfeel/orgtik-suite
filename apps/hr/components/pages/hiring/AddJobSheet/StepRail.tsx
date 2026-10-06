import { WizardStep } from "@/components/ui/wizard-step";
import { cn } from "@/lib/utils";

import type { AddJobStep } from "./types";

type StepRailProps = {
  steps: ReadonlyArray<AddJobStep>;
  currentStep: number;
  onStepChange?: (stepIndex: number) => void;
};

export default function StepRail({
  steps,
  currentStep,
  onStepChange,
}: StepRailProps) {
  return (
    <aside className="sticky top-0 h-full w-full bg-gray p-4 lg:w-[210px]">
      <div className="space-y-2">
        {steps.map((item, index) => {
          const isActive = index === currentStep;
          const isDone = index < currentStep;
          const isPending = index > currentStep;

          return (
            <div key={item.title}>
              <WizardStep
                step={index + 1}
                label={item.step}
                title={item.title}
                status={isActive ? "active" : isDone ? "done" : "pending"}
                disabled={isPending}
                onClick={() => onStepChange?.(index)}
                className={cn(isActive && "bg-gray/80")}
              />
              {item.description ? <p className="sr-only">{item.description}</p> : null}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
