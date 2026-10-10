"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Button,
  ErrorState,
  LoadingState,
  NoPermissionState,
} from "@orgtik/ui";
import {
  useGetActiveProjectQuery,
  useGetAllProjectsQuery,
  useSwitchProjectMutation,
} from "@/redux/features/projects/projectApi";
import { useAppDispatch } from "@/redux/app/hooks";
import { baseApi } from "@/redux/app/baseApi";
import { advanceMarketingProjectScope } from "@/lib/request-scope";
import { useRouter, usePathname } from "@/i18n/routing";
export default function ProjectRouteGate({
  children,
}: {
  children: ReactNode;
}) {
  const t = useTranslations("MarketingV3"),
    params = useSearchParams(),
    requested = params.get("projectId"),
    projects = useGetAllProjectsQuery(),
    active = useGetActiveProjectQuery(),
    [switchProject] = useSwitchProjectMutation(),
    dispatch = useAppDispatch(),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0),
    attempt = useRef<string | undefined>(undefined),
    router = useRouter(),
    pathname = usePathname();
  const visible = projects.data?.data.some((row) => row.id === requested),
    current = active.data?.data?.id;
  useEffect(() => {
    if (
      !requested ||
      !visible ||
      !current ||
      current === requested ||
      attempt.current === requested
    )
      return;
    let live = true;
    attempt.current = requested;
    setError(false);
    advanceMarketingProjectScope();
    void switchProject(requested)
      .unwrap()
      .then(() => {
        if (live) dispatch(baseApi.util.resetApiState());
      })
      .catch(() => {
        if (live) setError(true);
      });
    return () => {
      live = false;
    };
  }, [requested, visible, current, retry, switchProject, dispatch]);
  if (!requested) return children;
  const clear = () => {
    const next = new URLSearchParams(params.toString());
    next.delete("projectId");
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, {
      scroll: false,
    });
  };
  if (projects.isError || active.isError || error)
    return (
      <ErrorState
        titleAs="h1"
        title={t("projectSwitchFailed")}
        onRetry={() => {
          attempt.current = undefined;
          setError(false);
          setRetry((value) => value + 1);
          void projects.refetch();
          void active.refetch();
        }}
        action={
          <Button variant="secondary" onClick={clear}>
            {t("cancel")}
          </Button>
        }
      />
    );
  if (!projects.data || !active.data) return <LoadingState rows={5} />;
  if (!visible)
    return (
      <NoPermissionState
        titleAs="h1"
        title={t("projectUnavailable")}
        action={<Button onClick={clear}>{t("cancel")}</Button>}
      />
    );
  if (current !== requested) return <LoadingState rows={5} />;
  return children;
}
