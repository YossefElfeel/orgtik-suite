"use client";

// Customers go straight on to the CRM after signing in (FS-SOS-7). The page says what it's doing
// in the reader's language and is announced; when it can't go on, it says why and offers to sign
// in again (it showed English, "Domain found", and a "click here" link with no address). The
// hand-off itself moves to a one-time code in step 8 (FS-SOS-2); until then it goes through the
// single helper below.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Spinner } from "@orgtik/ui";
import { useAppDispatch, useAppSelector } from "@/redux/app/hooks";
import { IScope, useGetAllScopesQuery } from "@/redux/features/scopes/scopesApi";
import { useGetProfileQuery } from "@/redux/features/auth/authApi";
import { performLogout } from "@/redux/features/auth/authThunks";
import { isCustomerWithSalesScope } from "@/lib/user-utils";
import { isSameOriginDomain } from "@/lib/url-utils";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { handoffHref } from "@/lib/handoff";

type Problem = "noAccess" | "notConfigured" | "failed";

export default function RedirectingPage() {
  const t = useTranslations("Redirecting");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const userScopes = useAppSelector((s) => s.auth.scopes);
  const tokens = useAppSelector((s) => s.auth.tokens);
  const scopes = useGetAllScopesQuery();
  const profile = useGetProfileQuery(undefined, { skip: !tokens?.accessToken, refetchOnMountOrArgChange: true });
  const [problem, setProblem] = useState<Problem | null>(null);
  const done = useRef(false);

  const signInAgain = () => {
    dispatch(performLogout());
    router.replace("/auth/login");
  };

  useEffect(() => {
    if (done.current) return;
    if (!tokens?.accessToken || profile.isError) return signInAgain();
    if (profile.isLoading || scopes.isLoading) return;
    if (scopes.isError) return setProblem("failed");
    if (!user || !isCustomerWithSalesScope(user, userScopes)) return setProblem("noAccess");
    const domain = scopes.data?.data?.find((s: IScope) => s.name === "sales")?.domain ?? "";
    if (!domain || isSameOriginDomain(domain)) return setProblem("notConfigured");
    done.current = true;
    handoffHref(domain, tokens.accessToken, { scope: "sales" })
      .then((href) => window.location.assign(href))
      .catch(() => setProblem("failed"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userScopes, tokens, scopes.isLoading, scopes.isError, scopes.data, profile.isLoading, profile.isError]);

  if (problem) {
    return (
      <AuthPanel title={t(`${problem}Title`)} subtitle={t(`${problem}Body`)}>
        <Button size="lg" className="w-full" onClick={signInAgain}>
          {t("signInAgain")}
        </Button>
      </AuthPanel>
    );
  }

  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-4 text-center">
      <Spinner />
      <p className="font-display text-title-sm text-fg">{t("opening")}</p>
      <p className="text-body text-fg-muted">{t("openingBody")}</p>
    </div>
  );
}
