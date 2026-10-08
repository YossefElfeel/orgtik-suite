"use client";

// Websites (FS-SOS-9): the client sites a website manager can open. Each is a real button that
// opens the site signed in (they were clickable divs, stopped by popup blockers after the token
// request), and a failure says so. Loading, error and "none yet" have their states.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { Button, Card, EmptyState, ErrorState, LoadingState, PageHeader, Pagination, toast } from "@orgtik/ui";
import { useCreateTokenForCMSInstanceMutation, useGetCMSInstancesQuery } from "@/redux/features/cms/cmsApi";
import { CmsLogo } from "@/components/pages/systems/CmsLogo";
import { openSite } from "@/lib/open-site";

export default function WebsitesPage() {
  const t = useTranslations("Websites");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const { data, isLoading, isError, refetch } = useGetCMSInstancesQuery({ page, limit });
  const [getToken] = useCreateTokenForCMSInstanceMutation();
  const [opening, setOpening] = useState<number | null>(null);
  const sites = data?.data ?? [];

  const open = async (id: number, domain: string) => {
    setOpening(id);
    const ok = await openSite(async () => {
      const r = await getToken(id).unwrap();
      const { accessToken, refreshToken } = r.data as { accessToken: string; refreshToken?: string };
      const base = (/^https?:/.test(domain) ? domain : `https://${domain}`).replace(/\/$/, "");
      return `${base}/auth?token=${encodeURIComponent(accessToken)}${refreshToken ? `&refreshToken=${encodeURIComponent(refreshToken)}` : ""}`;
    });
    setOpening(null);
    if (!ok) toast.error(t("openFailed"));
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      {isLoading ? (
        <LoadingState rows={4} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : sites.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyBody")} />
      ) : (
        <>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(18rem,100%),1fr))] gap-4">
            {sites.map((s) => (
              <li key={s.id}>
                <Card className="flex h-full flex-col gap-4 p-5">
                  <div className="flex items-center gap-3">
                    <CmsLogo cms={s} />
                    <span className="flex min-w-0 flex-col">
                      <span dir="auto" className="truncate font-display text-title-sm text-fg">{s.name}</span>
                      <span dir="ltr" className="truncate text-start text-caption text-fg-muted">{s.domain?.replace(/^https?:\/\//, "")}</span>
                    </span>
                  </div>
                  <Button className="mt-auto self-start" variant="secondary" endIcon={<ArrowSquareOut className="rtl:-scale-x-100" />} loading={opening === s.id} onClick={() => open(s.id, s.domain)}>
                    {t("open", { name: s.name })}
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
          {Number(data?.meta?.total ?? 0) > limit ? (
            <Pagination page={page} pageSize={limit} total={Number(data?.meta?.total ?? 0)} pageSizes={[12, 24, 48]} onPageChange={setPage} onPageSizeChange={(n) => { setLimit(n); setPage(1); }} />
          ) : null}
        </>
      )}
    </div>
  );
}
