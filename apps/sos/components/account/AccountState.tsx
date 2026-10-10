"use client";
import { useTranslations } from "next-intl";
import { ErrorState, LoadingState, NoPermissionState, SuiteRequestError } from "@orgtik/ui";
export function AccountState({ loading, error, retry, children }: { loading: boolean; error?: unknown; retry: () => Promise<unknown>; children: React.ReactNode }) {
  const t = useTranslations("AccountV3");
  if (loading && !error) return <LoadingState rows={5} label={t("loading")} />;
  if (error) return [401, 403].includes((error as { status?: number }).status || 0) ? <NoPermissionState title={t("forbidden")} description={t("askOwner")} /> : <ErrorState title={t("loadFailed")} description={t("retryHint")} onRetry={() => void retry()} />;
  return <>{children}</>;
}
export function useAccountProblem() { const t = useTranslations("AccountV3"); return (error: unknown) => { const code = (error as { code?: string })?.code || "unknown"; return t.has(`problems.${code}`) ? t(`problems.${code}`) : t("saveFailed"); }; }
