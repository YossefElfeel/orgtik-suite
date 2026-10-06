"use client";
// Change which tools someone can use, with what that does said before saving: under seat model A
// seats don't move; under B each per-user tool gained or lost moves one seat on its line.
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@orgtik/ui";
import type { AppMe } from "@/redux/features/platform/platformApi";
import type { Team, TeamMember } from "@/redux/features/platform/team";
import { Notice } from "@/components/workspace/account/Notice";
import { ToolAccess, accessibleTools } from "./ToolAccess";
import { linesFor } from "./seats";

export function AccessDialog({ open, onOpenChange, member, team, me, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; member: TeamMember | null; team: Team; me: AppMe; onSave: (tools: string[] | null) => Promise<unknown> }) {
  const t = useTranslations("Team.accessDialog");
  const [value, setValue] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [empty, setEmpty] = useState(false);
  useEffect(() => {
    if (open && member) {
      setValue(member.tools);
      setEmpty(false);
    }
  }, [open, member]);
  if (!member) return null;

  const { seatModel, perUserLines } = team.meta;
  const before = linesFor(perUserLines, seatModel, member.role, member.tools).length;
  const after = linesFor(perUserLines, seatModel, member.role, value).length;
  const impact = member.role === "guest" ? t("impactGuest") : seatModel !== "B" || before === after ? t("impactSame") : after > before ? t("impactMore", { count: after - before }) : t("impactFewer", { count: before - after });

  const save = async () => {
    if (value !== null && value.length === 0) {
      setEmpty(true);
      return;
    }
    setSaving(true);
    await onSave(value);
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{t("title", { name: member.name })}</DialogTitle>
          <DialogDescription>{t("body")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-5">
          <ToolAccess tools={accessibleTools(me.tools)} value={value} onChange={setValue} error={empty ? t("errorEmpty") : undefined} />
          <Notice tone="info">{impact}</Notice>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button variant="primary" loading={saving} onClick={save}>
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
