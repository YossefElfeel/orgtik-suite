"use client";

import { useState, type ReactElement } from "react";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { useTranslations } from "next-intl";

type Props = {
  trigger: ReactElement;
  id: string;
};

export default function ChangePlanDialog({ trigger }: Props) {
  const t = useTranslations("subscriptions");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);

  return (
    <ReusableDialog
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title={t("changePlan", { fallback: "Change Plan" })}
      size="xl"
      className="sm:max-w-[700px]"
      footer={
        <DialogClose render={<Button type="button" variant="outline" />}>
          {tCommon("close", { fallback: "Close" })}
        </DialogClose>
      }
    >
      <div className="rounded-xl border border-orange/40 bg-orange/10 px-4 py-3.5">
        <p className="text-sm font-semibold text-orange">
          {t("customPlanSwappedDesc", { fallback: "Custom-plan portion can't be swapped" })}
        </p>
        <p className="mt-2 text-sm text-foreground/80">
          {t("customPlanSwappedMsg", { fallback: "This subscription belongs to a multi-portion custom plan that was built specifically for this project. Swapping to a catalog plan would orphan its companion portion and lose the per-feature pricing. To change what's on this project, remove the custom plan and add a new one from the project page." })}
        </p>
      </div>
    </ReusableDialog>
  );
}
