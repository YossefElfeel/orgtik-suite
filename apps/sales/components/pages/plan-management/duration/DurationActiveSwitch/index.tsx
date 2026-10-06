"use client";

import { Switch } from "@/components/ui/switch";
import { useUpdateDurationMutation } from "@/redux/features/durations/durationsApi";
import { formatDurationLabel } from "@/lib/durations";
import type { Duration } from "@/types/durations";
import { useTranslations } from "next-intl";

type Props = {
  duration: Duration;
};

export default function DurationActiveSwitch({ duration }: Props) {
  const [updateDuration, { isLoading }] = useUpdateDurationMutation();
  const tCommon = useTranslations("common");
  const label = formatDurationLabel(duration.months, tCommon);

  return (
    <Switch
      checked={duration.isActive}
      disabled={isLoading}
      aria-label={`Toggle ${label}`}
      onCheckedChange={(checked) => {
        void updateDuration({
          id: duration.id,
          body: {
            months: duration.months,
            percentage: duration.percentage,
            isActive: checked,
          },
        }).unwrap();
      }}
    />
  );
}
