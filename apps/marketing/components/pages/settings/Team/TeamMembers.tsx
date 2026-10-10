"use client";

// Settings › Team: who is on the active project and their Marketing roles, read-only. People and
// their access are managed in SOS, so the page links there. It used to be made-up rows with invites,
// job titles and roles that did nothing (MKT-034), and roles (Admin, Viewer, Editor) that the app
// doesn't have (MKT-035).
import { useTranslations } from "next-intl";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { Avatar, Badge, buttonVariants } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { SOS_URL } from "@/constants";
import { useGetActiveProjectQuery } from "@/redux/features/projects/projectApi";
import type { IProjectMember } from "@/types/projects";

const ROLE_ORDER = [
  "super_admin",
  "marketing_manager",
  "marketing_specialist",
  "content_writer",
  "client_reviewer",
];

export function TeamMembers() {
  const t = useTranslations("SettingsTeam");
  const { data, isLoading, isError, error, refetch } =
    useGetActiveProjectQuery();
  const members: IProjectMember[] = data?.data?.members ?? [];
  const errorStatus = (error as { status?: number | string } | undefined)
    ?.status;
  const status = isLoading
    ? "loading"
    : isError
      ? errorStatus === 403
        ? "forbidden"
        : errorStatus === 404
          ? "ready"
          : "error"
      : "ready";
  const roleLabel = (r: string) =>
    t.has(`role_${r}`) ? t(`role_${r}`) : t("role_other");

  const manage = (
    <a
      href={`${SOS_URL}/go/global?redirect=/systems`}
      className={buttonVariants({ variant: "secondary" })}
    >
      {t("manageInSos")}
      <ArrowSquareOut aria-hidden className="size-4 rtl:-scale-x-100" />
    </a>
  );

  const columns: ColumnDef<IProjectMember>[] = [
    {
      id: "name",
      header: t("colMember"),
      meta: { truncate: true },
      cell: ({ row }) => {
        const m = row.original;
        const name = `${m.firstName} ${m.lastName}`.trim();
        return (
          <span className="flex min-w-0 items-center gap-3">
            <Avatar name={name} src={m.avatar} size="sm" decorative />
            <span className="flex min-w-0 flex-col">
              <span dir="auto" className="truncate font-semibold text-fg">
                {name}
              </span>
              <bdi dir="ltr" className="truncate text-body-sm text-fg-muted">
                {m.email}
              </bdi>
            </span>
          </span>
        );
      },
    },
    {
      id: "jobTitle",
      header: t("colJobTitle"),
      cell: ({ row }) =>
        row.original.jobTitle ? (
          <span dir="auto">{row.original.jobTitle}</span>
        ) : (
          <span className="text-fg-subtle">{t("noJobTitle")}</span>
        ),
    },
    {
      id: "roles",
      header: t("colRoles"),
      cell: ({ row }) => {
        const roles = [...(row.original.roles ?? [])].sort(
          (a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b),
        );
        return roles.length ? (
          <span className="flex flex-wrap gap-1">
            {roles.map((r) => (
              <Badge
                key={r}
                tone={r === "super_admin" ? "brand" : "neutral"}
                size="sm"
              >
                {roleLabel(r)}
              </Badge>
            ))}
          </span>
        ) : (
          <span className="text-fg-subtle">{t("noRole")}</span>
        );
      },
    },
  ];

  return (
    <section aria-labelledby="team-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="team-title" className="font-display text-title-sm text-fg">
            {t("title")}
          </h2>
          <p className="max-w-prose text-body-sm text-fg-muted">{t("hint")}</p>
        </div>
        {manage}
      </div>
      <DataTable
        label={t("tableLabel")}
        columns={columns}
        data={members}
        getRowId={(m) => String(m.id)}
        status={status}
        onRetry={refetch}
        paginate
        empty={{
          title: errorStatus === 404 ? t("noProject") : t("emptyTitle"),
          description: t("emptyBody"),
          action: errorStatus === 404 ? undefined : manage,
        }}
        error={{ title: t("loadError") }}
        forbidden={{ title: t("forbidden") }}
      />
    </section>
  );
}
