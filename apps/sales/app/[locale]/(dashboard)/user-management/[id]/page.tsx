"use client";

// A staff member's page: loading, not found, no access and error each have their own state, and
// the loading title is never put in the page heading (SAL-149).
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { EmptyState, ErrorState, LoadingState, NoPermissionState, PageHeader } from "@orgtik/ui";
import { ButtonLink } from "@/components/shared/ButtonLink";
import UserDetails from "@/components/pages/user-management/UserDetails";
import { useGetStaffMemberQuery } from "@/redux/features/staff/staffApi";
import { errorStatus } from "@/lib/commissions";

export default function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations("Team.users");
  const { data, isLoading, isError, error, refetch } = useGetStaffMemberQuery(id, { skip: !id });
  const user = data?.data;
  const back = [{ label: t("title"), href: "/user-management" }];

  if (user) return <UserDetails user={user} />;

  const code = errorStatus(error);
  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={t("title")} breadcrumb={back} />
      {isLoading || (!isError && !user && !data) ? (
        <LoadingState rows={4} label={t("loading")} />
      ) : code === 403 ? (
        <NoPermissionState title={t("noAccessTitle")} description={t("noAccessBody")} />
      ) : code === 404 || !isError ? (
        <EmptyState
          title={t("notFoundTitle")}
          description={t("notFoundBody")}
          action={
            <ButtonLink href="/user-management" variant="secondary">
              {t("backToList")}
            </ButtonLink>
          }
        />
      ) : (
        <ErrorState title={t("detailErrorTitle")} description={t("errorBody")} onRetry={() => void refetch()} />
      )}
    </section>
  );
}
