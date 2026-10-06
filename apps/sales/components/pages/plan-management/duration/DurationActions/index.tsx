"use client";

import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/dialogs/shared/DeleteDialog";
import DurationManagement from "@/components/dialogs/plan-management/DurationManagement";
import { useDeleteDurationMutation } from "@/redux/features/durations/durationsApi";
import { formatDurationLabel } from "@/lib/durations";
import type { Duration } from "@/types/durations";
import { useTranslations } from "next-intl";

type Props = {
  duration: Duration;
};

export default function DurationActions({ duration }: Props) {
  const [deleteDuration, { isLoading }] = useDeleteDurationMutation();
  const tCommon = useTranslations("common");
  const label = formatDurationLabel(duration.months, tCommon);

  return (
    <div className="flex items-center gap-1.5">
      <DurationManagement
        kind={duration.type}
        duration={duration}
        trigger={
          <Button
            type="button"
            variant="ghost-edit"
            size="icon-sm"
            aria-label={`Edit ${label}`}
            icon="solar:pen-linear"
          />
        }
      />
      <DeleteDialog
        title={`duration ${label}`}
        isLoading={isLoading}
        onConfirm={() => {
          void deleteDuration(duration.id).unwrap();
        }}
        trigger={
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            aria-label={`Delete ${label}`}
            icon="solar:trash-bin-trash-linear"
          />
        }
      />
    </div>
  );
}
