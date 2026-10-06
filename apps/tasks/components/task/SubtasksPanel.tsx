"use client";
import { useState, type JSX } from "react";
import { useTranslations } from "next-intl";
import { ArrowsOut } from "@phosphor-icons/react";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, IconButton } from "@orgtik/ui";
import { useSubtasks } from "./subtasks/useSubtasks";
import { SubtasksView } from "./subtasks/SubtasksView";

/**
 * A task's subtasks, in the task sheet. The "larger view" is the same view on a dialog, reading
 * the same data, so the two can't drift apart.
 *
 * readOnly (viewers, View as sessions): the checkboxes are read-only and there is no add, rename,
 * delete or reorder.
 */
export function SubtasksPanel({ taskId, readOnly }: { taskId: number; readOnly: boolean }): JSX.Element {
  const t = useTranslations("TaskSubtasks");
  const model = useSubtasks(taskId);
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <SubtasksView
        model={model}
        readOnly={readOnly}
        size="compact"
        headerEnd={
          <IconButton
            variant="ghost"
            size="sm"
            label={t("expand")}
            icon={<ArrowsOut />}
            onClick={() => setExpanded(true)}
            className="shrink-0"
          />
        }
      />
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>{t("dialogTitle")}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <SubtasksView model={model} readOnly={readOnly} size="large" />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
