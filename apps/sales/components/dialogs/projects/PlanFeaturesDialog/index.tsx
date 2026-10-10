"use client";

import { Check as CheckIcon } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@orgtik/ui";
import type { PlanCardItem } from "@/types/plans";
import { useTranslations } from "next-intl";

type Props = {
  plan: PlanCardItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function PlanFeaturesDialog({ plan, open, onOpenChange }: Props) {
  const t = useTranslations("projects");

  if (!plan) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="px-5 pt-5 pb-2">
          <DialogHeader className="gap-0 p-0 text-left">
            <DialogTitle className="text-2xl font-semibold">
              {plan.name}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("includesCountFeatures", { count: plan.featuresTotal, fallback: `Includes (${plan.featuresTotal}) features` })}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-5 pb-5">
          <ul className="flex max-h-[min(60vh,420px)] flex-col gap-2 overflow-y-auto">
            {plan.features.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-3 text-base text-secondary"
              >
                <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-sm border border-secondary text-secondary">
                  <CheckIcon className="size-3" weight="bold" />
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
