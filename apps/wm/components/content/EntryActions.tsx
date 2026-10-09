"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { DotsThree, Eye, PencilSimple, Trash } from "@phosphor-icons/react";
import {
  ConfirmDialog,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuLinkItem,
  MenuTrigger,
} from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import { useCan } from "@/lib/permissions";
import { TYPES } from "@/lib/contentTypes";
import { type EntrySummary, useDeleteEntryMutation } from "@/store/api";

export function EntryActions({
  entry,
  returnTo,
}: {
  entry: EntrySummary;
  returnTo: string;
}) {
  const t = useTranslations("Improvements");
  const can = useCan();
  const [deleting, setDeleting] = useState(false);
  const [remove] = useDeleteEntryMutation();
  const href = `/content/${TYPES[entry.type].area}/${entry.id}?returnTo=${encodeURIComponent(returnTo)}`;
  const deletable =
    ["article", "caseStudy", "roadmapItem", "review"].includes(entry.type) &&
    entry.visibility === "not_on_site";
  return (
    <span onClick={(event) => event.stopPropagation()}>
      <Menu>
        <MenuTrigger
          render={<IconButton label={t("actions")} icon={<DotsThree />} />}
        />
        <MenuContent align="end">
          <MenuLinkItem
            render={<Link href={`${href}&view=1`} />}
            icon={<Eye />}
          >
            {t("view")}
          </MenuLinkItem>
          {can("content:edit") ? (
            <MenuLinkItem render={<Link href={href} />} icon={<PencilSimple />}>
              {t("edit")}
            </MenuLinkItem>
          ) : null}
          <MenuItem
            icon={<Trash />}
            tone="danger"
            disabled={!can("content:edit") || !deletable}
            title={!deletable ? t("protectedDelete") : undefined}
            onClick={() => setDeleting(true)}
          >
            {t("delete")}
          </MenuItem>
        </MenuContent>
      </Menu>
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={t("deleteName", { name: entry.name })}
        impact={t("deleteImpact")}
        confirmLabel={t("delete")}
        irreversible
        onConfirm={() => remove({ type: entry.type, id: entry.id }).unwrap()}
      />
    </span>
  );
}
