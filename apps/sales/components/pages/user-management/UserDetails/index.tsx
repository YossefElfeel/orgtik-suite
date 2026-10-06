"use client";

// One staff member, read-only: their CRM role and access come from SOS, which is where an admin
// changes them. The old page claimed that disabling here stopped sign-in; it didn't (SAL-006).
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Info } from "@phosphor-icons/react";
import { Card, CardHeader, PageHeader } from "@orgtik/ui";
import { useRole } from "@/hooks/useRole";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { SalesStatus } from "@/components/shared/SalesStatus";
import RoleBadge from "@/components/pages/user-management/RoleBadge";
import ViewAsLink from "@/components/pages/user-management/ViewAsLink";
import ManageInSosLink from "@/components/pages/user-management/ManageInSosLink";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import { useTeamFormat } from "@/lib/commissions";
import { isolate } from "@/lib/bidi";
import { userAccess, type StaffDetail } from "@/types/users";

export default function UserDetails({ user }: { user: StaffDetail }) {
  const t = useTranslations("Team.users");
  const f = useTeamFormat();
  const display = useCatalogDisplayText();
  const { isAdmin } = useRole();
  const access = userAccess(user);

  const rows: { label: string; value: ReactNode }[] = [
    { label: t("email"), value: <bdi dir="ltr">{user.email}</bdi> },
    { label: t("phone"), value: user.phoneNumber ? <bdi dir="ltr">{user.phoneNumber}</bdi> : "—" },
    { label: t("department"), value: user.department ? <span dir="auto">{display(user.department.name)}</span> : "—" },
    { label: t("zone"), value: user.zone ? <span dir="auto">{display(user.zone.name)}</span> : "—" },
    { label: t("address"), value: user.address ? <span dir="auto">{user.address}</span> : "—" },
    { label: t("since"), value: f.date(user.createdAt) ?? "—" },
  ];

  const accessNote =
    access === "active" ? t("accessActive", { name: isolate(user.fullName) }) : access === "invited" ? t("accessInvited", { name: isolate(user.fullName) }) : t("accessNone", { name: isolate(user.fullName) });

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title={<span dir="auto">{user.fullName}</span>}
        breadcrumb={[{ label: t("title"), href: "/user-management" }, { label: user.fullName }]}
        status={
          <span className="flex flex-wrap items-center gap-2">
            <RoleBadge role={user.role} />
            <SalesStatus kind="access" value={access} size="sm" />
          </span>
        }
        actions={
          <>
            {user.role === "salesman" ? (
              <ButtonLink href={`/salesman/${user.id}`} variant="ghost">
                {t("openSalesperson")}
                <ArrowRight aria-hidden className="size-4 rtl:-scale-x-100" />
              </ButtonLink>
            ) : null}
            <ViewAsLink authUserId={user.authUserId} name={user.fullName} />
          </>
        }
      />

      <Card className="flex flex-col gap-4">
        <CardHeader title={t("accessTitle")} actions={<ManageInSosLink />} />
        <p className="flex items-start gap-2 text-body text-fg-muted">
          <Info aria-hidden className="mt-1 size-4 shrink-0 text-fg-brand" />
          <span>
            {accessNote} {isAdmin ? t("accessChangeAdmin") : t("accessChangeManager")}
          </span>
        </p>
      </Card>

      <Card className="flex flex-col gap-4">
        <CardHeader title={t("detailsTitle")} />
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.label} className="flex min-w-0 flex-col gap-0.5">
              <dt className="text-caption text-fg-muted">{r.label}</dt>
              <dd className="min-w-0 break-words text-body text-fg">{r.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </section>
  );
}
