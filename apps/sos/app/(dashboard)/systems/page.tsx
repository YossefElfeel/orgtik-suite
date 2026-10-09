"use client";

// Systems › Suite apps (FS-SOS-9). The table fits the page (it scrolled sideways at 1440), each app
// shows by its name in the reader's language with its address and status in words, and turning an
// app off is confirmed with what it does (it was a bare switch).
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, DotsThreeVertical, PencilSimple, Plus, Power, Prohibit } from "@phosphor-icons/react";
import { Badge, Button, ConfirmDialog, IconButton, Menu, MenuContent, MenuItem, MenuTrigger, PageHeader } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { IScope, useGetAllScopesQuery, useUpdateScopeMutation } from "@/redux/features/scopes/scopesApi";
import { SystemsNav } from "@/components/pages/systems/SystemsNav";
import { SystemDialog } from "@/components/pages/systems/SystemDialog";
import { APP_ICONS, useAppLabel } from "@/components/suite/useSuiteApps";

export default function SuiteAppsPage() {
  const t = useTranslations("Systems");
  const appLabel = useAppLabel();
  const { data, isLoading, isError, refetch } = useGetAllScopesQuery({ page: 1, limit: 100 });
  const [updateScope] = useUpdateScopeMutation();
  const [editing, setEditing] = useState<IScope | "new" | null>(null);
  const [turningOff, setTurningOff] = useState<IScope | null>(null);
  const apps = data?.data ?? [];

  const columns: ColumnDef<IScope>[] = [
    {
      id: "app",
      header: t("colApp"),
      meta: { truncate: true },
      cell: ({ row }) => {
        const s = row.original;
        return (
          <span className="flex min-w-0 items-center gap-3">
            <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-field bg-brand-subtle text-fg-brand [&>svg]:size-5">
              {APP_ICONS[s.name] ?? APP_ICONS.global}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-semibold text-fg">{appLabel(s.name, s.displayName)}</span>
              <span dir="ltr" className="truncate text-start text-caption text-fg-muted">{s.name}</span>
            </span>
          </span>
        );
      },
    },
    {
      id: "address",
      header: t("colAddress"),
      meta: { truncate: true },
      cell: ({ row }) => (
        <a href={row.original.domain} target="_blank" rel="noopener noreferrer" dir="ltr" className="truncate text-fg-brand underline-offset-2 hover:underline">
          {row.original.domain.replace(/^https?:\/\//, "")}
        </a>
      ),
    },
    {
      id: "status",
      header: t("colStatus"),
      cell: ({ row }) =>
        row.original.isActive !== false ? (
          <Badge tone="success" emphasis="subtle" icon={<CheckCircle weight="fill" />}>{t("on")}</Badge>
        ) : (
          <Badge tone="neutral" emphasis="subtle" icon={<Prohibit />}>{t("off")}</Badge>
        ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t("colActions")}</span>,
      meta: { width: "1%" },
      cell: ({ row }) => {
        const s = row.original;
        const name = appLabel(s.name, s.displayName);
        const on = s.isActive !== false;
        return (
          <Menu>
            <MenuTrigger render={<IconButton variant="ghost" size="sm" label={t("actionsFor", { name })} icon={<DotsThreeVertical weight="bold" />} />} />
            <MenuContent align="end">
              <MenuItem icon={<PencilSimple />} onClick={() => setEditing(s)}>
                {t("edit")}
              </MenuItem>
              {/* Home (global) is SOS itself: it can't be turned off from here. */}
              {s.name !== "global" ? (
                on ? (
                  <MenuItem icon={<Power />} onClick={() => setTurningOff(s)}>
                    {t("turnOff")}
                  </MenuItem>
                ) : (
                  <MenuItem icon={<Power />} onClick={() => updateScope({ id: s.id, data: { isActive: true } } as never).catch(() => {})}>
                    {t("turnOn")}
                  </MenuItem>
                )
              ) : null}
            </MenuContent>
          </Menu>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("pageDescription")}
        actions={
          <Button variant="primary" startIcon={<Plus />} onClick={() => setEditing("new")}>
            {t("add")}
          </Button>
        }
      />
      <SystemsNav />
      <DataTable
        label={t("tabApps")}
        columns={columns}
        data={apps}
        getRowId={(s) => String(s.id)}
        paginate
        status={isLoading ? "loading" : isError ? "error" : "ready"}
        onRetry={refetch}
        empty={{ title: t("emptyApps"), action: <Button variant="primary" startIcon={<Plus />} onClick={() => setEditing("new")}>{t("add")}</Button> }}
      />
      <SystemDialog system={editing === "new" ? null : editing} open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} />
      <ConfirmDialog
        open={turningOff !== null}
        onOpenChange={(o) => !o && setTurningOff(null)}
        title={turningOff ? t("turnOffTitle", { name: appLabel(turningOff.name, turningOff.displayName) }) : ""}
        impact={turningOff ? t("turnOffImpact", { name: appLabel(turningOff.name, turningOff.displayName) }) : ""}
        confirmLabel={t("turnOff")}
        tone="danger"
        onConfirm={async () => {
          if (turningOff) await updateScope({ id: turningOff.id, data: { isActive: false } } as never).unwrap();
        }}
      />
    </div>
  );
}
