import { CaretDown as ChevronDown, Check, Microphone as Mic } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import type { IJobApplicationStage, JobApplicationStage } from "@/types/job";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpdateApplicationStageMutation } from "@/redux/features/job/jobApi";
import { useFormatter, useTranslations } from "next-intl";

type Props = {
  applicationId?: number;
  stages: IJobApplicationStage[];
};

const STAGE_OPTIONS: JobApplicationStage[] = [
  "applying",
  "screening",
  "interview",
  "hiring",
  "accepted",
  "rejected",
];

function Stage({ applicationId, stages }: Props) {
  const t = useTranslations("jobs");
  const format = useFormatter();
  const formatStageDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return format.dateTime(date, { dateStyle: "short", timeStyle: "short" });
  };
  const [updateApplicationStage, { isLoading }] =
    useUpdateApplicationStageMutation();
  const currentStage = stages[stages.length - 1];
  const handleStageChange = async (nextStage: JobApplicationStage) => {
    if (!applicationId) return;
    try {
      await updateApplicationStage({
        applicationId,
        data: {
          stage: nextStage,
          stageAt: new Date().toISOString(),
        },
      }).unwrap();
    } catch {}
  };

  return (
    <section
      className={"flex w-full flex-col gap-4 rounded-2xl border bg-raised p-6"}
    >
      <div className="flex items-center justify-between gap-4 border-b pb-4">
        <h3 className="text-title-sm leading-6 font-medium ">
          {t("candidateDetails.stageOf")} {currentStage ? t(`stages.${currentStage.stage}`) : t("common.na")}
        </h3>

        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={isLoading}
            render={
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-11 rounded-xl px-4 text-base font-medium text-fg-muted"
              />
            }
          >
            {currentStage ? t(`stages.${currentStage.stage}`) : t("common.na")}
            <ChevronDown className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {STAGE_OPTIONS.map((stageOption) => (
              <DropdownMenuItem
                key={stageOption}
                onClick={() => void handleStageChange(stageOption)}
                disabled={isLoading || currentStage?.stage === stageOption}
              >
                {t(`stages.${stageOption}`)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4 gap-y-6">
        {stages.map((stage, index) => {
          const isCurrent = index === stages.length - 1;
          const formattedStageDate = stage.stageAt
            ? formatStageDate(stage.stageAt)
            : t("common.pending");

          return (
            <div
              key={stage.id}
              className="relative min-w-36 flex flex-1 items-start gap-3"
            >
              <span
                className={`relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
                  isCurrent ? "bg-primary text-white" : "bg-line-strong text-white"
                }`}
              >
                {isCurrent ? (
                  <Mic className="size-3.5" />
                ) : (
                  <Check className="size-3.5" />
                )}
              </span>

              <div className="space-y-1">
                <p className="text-title-sm leading-5 font-semibold ">
                  {t(`stages.${stage.stage}`)}
                </p>
                <p className="text-caption text-fg-subtle">{formattedStageDate}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default Stage;
