"use client";

// People's columns (FS-SOS-4). Each row's actions are a named menu; the dialogs it opens live on the
// page, outside the menu. Tools are named from the suite catalog (it showed "Hr System" built from
// snake_case keys), dates follow the reader's language, and status is a word with an icon.
import { useTranslations } from "next-intl";
import { CheckCircle, DotsThreeVertical, Eye, IdentificationBadge, PencilSimple, Prohibit, ShieldCheck, Trash } from "@phosphor-icons/react";
import { Avatar, Badge, IconButton, Menu, MenuContent, MenuItem, MenuLinkItem, MenuSeparator, MenuTrigger, Tag, useFormatter } from "@orgtik/ui";
import type { ColumnDef } from "@orgtik/ui/table";
import { IPeopleItem } from "@/types/user";
import { useAppLabel } from "@/components/suite/useSuiteApps";

export type PersonAction = "edit" | "type" | "loginAs" | "deactivate" | "activate" | "delete";

export { personName } from "@/lib/person";
import { personName } from "@/lib/person";

const MAX_TOOLS = 2;

export function usePeopleColumns({ meId, canLoginAs, onAction }: { meId?: number; canLoginAs: boolean; onAction: (action: PersonAction, person: IPeopleItem) => void }) {
  const t = useTranslations("People");
  const f = useFormatter();
  const appLabel = useAppLabel();

  const columns: ColumnDef<IPeopleItem>[] = [
    {
      id: "person",
      header: t("colPerson"),
      meta: { truncate: true },
      cell: ({ row }) => {
        const p = row.original;
        const name = personName(p);
        return (
          <span className="flex min-w-0 items-center gap-3">
            <Avatar name={name} src={p.avatar ?? undefined} size="sm" decorative />
            <span className="flex min-w-0 flex-col">
              <span dir="auto" className="truncate font-semibold text-fg">
                {name}
              </span>
              <span dir="ltr" className="truncate text-start text-caption text-fg-muted">
                {p.email}
              </span>
            </span>
          </span>
        );
      },
    },
    {
      id: "tools",
      header: t("colTools"),
      cell: ({ row }) => {
        // Everyone has Home (the global scope): listing it on every row says nothing.
        const tools = (row.original.scopes ?? []).filter((s) => s !== "global");
        if (!tools.length) return <span className="text-fg-muted">{t("noTools")}</span>;
        const shown = tools.slice(0, MAX_TOOLS);
        return (
          <span className="flex items-center gap-1 whitespace-nowrap">
            {shown.map((s) => (
              <Tag key={s}>{appLabel(s, s)}</Tag>
            ))}
            {tools.length > MAX_TOOLS ? (
              <span title={tools.slice(MAX_TOOLS).map((s) => appLabel(s, s)).join(", ")} className="text-caption text-fg-muted">
                {t("moreTools", { count: tools.length - MAX_TOOLS })}
              </span>
            ) : null}
          </span>
        );
      },
    },
    {
      id: "type",
      header: t("colType"),
      cell: ({ row }) => <span className="text-fg-muted">{t(`types.${row.original.userType ?? "none"}`)}</span>,
    },
    {
      id: "status",
      header: t("colStatus"),
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge tone="success" emphasis="subtle" icon={<CheckCircle weight="fill" />}>
            {t("active")}
          </Badge>
        ) : (
          <Badge tone="neutral" emphasis="subtle" icon={<Prohibit />}>
            {t("inactive")}
          </Badge>
        ),
    },
    {
      id: "joined",
      header: t("colJoined"),
      meta: { numeric: true },
      cell: ({ row }) => <span className="text-fg-muted">{f.date(row.original.createdAt, { dateStyle: "medium" })}</span>,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t("colActions")}</span>,
      meta: { width: "1%" },
      cell: ({ row }) => {
        const p = row.original;
        const name = personName(p);
        const self = p.id === meId;
        return (
          <Menu>
            <MenuTrigger render={<IconButton variant="ghost" size="sm" label={t("actionsFor", { name })} icon={<DotsThreeVertical weight="bold" />} />} />
            <MenuContent align="end">
              <MenuItem icon={<PencilSimple />} onClick={() => onAction("edit", p)}>
                {t("edit")}
              </MenuItem>
              <MenuItem icon={<IdentificationBadge />} onClick={() => onAction("type", p)}>
                {t("changeType")}
              </MenuItem>
              <MenuLinkItem icon={<ShieldCheck />} href={`/people/${p.id}/scopes`}>
                {t("manageAccess")}
              </MenuLinkItem>
              {canLoginAs && !self && p.isActive ? (
                <MenuItem icon={<Eye />} onClick={() => onAction("loginAs", p)}>
                  {t("loginAs")}
                </MenuItem>
              ) : null}
              {/* Nobody deactivates or deletes their own account from here. */}
              {!self ? (
                <>
                  <MenuSeparator />
                  {p.isActive ? (
                    <MenuItem icon={<Prohibit />} onClick={() => onAction("deactivate", p)}>
                      {t("deactivate")}
                    </MenuItem>
                  ) : (
                    <MenuItem icon={<CheckCircle />} onClick={() => onAction("activate", p)}>
                      {t("activate")}
                    </MenuItem>
                  )}
                  <MenuItem tone="danger" icon={<Trash />} onClick={() => onAction("delete", p)}>
                    {t("delete")}
                  </MenuItem>
                </>
              ) : null}
            </MenuContent>
          </Menu>
        );
      },
    },
  ];
  return columns;
}
