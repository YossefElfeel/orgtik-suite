"use client";

// Your profile: your details on the suite profile, which notifications reach you, and, for
// salespeople, the bank account commissions are paid to. One tab each, the tab in the address. The
// header said "Welcome Title" (SAL-054). The password and sign-in live in SOS, which this links to.
import { useTranslations } from "next-intl";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { ErrorState, LoadingState, PageHeader, Tabs, TabsList, TabsPanel, buttonVariants } from "@orgtik/ui";
import { SOS_URL } from "@/constants";
import { useRole } from "@/hooks/useRole";
import { useAppSelector } from "@/redux/app/hooks";
import { useGetAuthProfileQuery } from "@/redux/features/auth/authSosApi";
import PersonalInformationForm from "@/components/pages/profile/PersonalInformationForm";
import NotificationPreferencesForm from "@/components/pages/profile/NotificationPreferencesForm";
import BankAccountForm from "@/components/pages/profile/BankAccountForm";
import { useUrlState } from "@/lib/commissions";
import type { ProfileTab } from "@/types/profile";

const SOS_PROFILE = `${SOS_URL}/go/global?redirect=${encodeURIComponent("/profile")}`;

export default function ProfilePage() {
  const t = useTranslations("Team.profile");
  const { isSalesman, isReady } = useRole();
  const token = useAppSelector((state) => state.auth.token);
  const profile = useGetAuthProfileQuery(undefined, { skip: !token });
  const url = useUrlState();
  const tabs: ProfileTab[] = isSalesman ? ["personal", "notifications", "bank"] : ["personal", "notifications"];
  const tab: ProfileTab = (tabs as string[]).includes(url.get("tab")) ? (url.get("tab") as ProfileTab) : "personal";

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <a href={SOS_PROFILE} className={buttonVariants({ variant: "secondary" })}>
            {t("passwordInSos")}
            <ArrowSquareOut aria-hidden className="size-4 rtl:-scale-x-100" />
          </a>
        }
      />
      {!isReady ? (
        <LoadingState rows={4} label={t("title")} />
      ) : (
        <Tabs value={tab} onValueChange={(v) => url.set({ tab: v === "personal" ? null : String(v) })}>
          <TabsList items={tabs.map((v) => ({ value: v, label: t(`tab.${v}`) }))} />
          <TabsPanel value="personal" className="pt-6">
            {tab === "personal" ? (
              profile.isLoading || (token && !profile.data && !profile.isError) ? (
                <LoadingState rows={5} label={t("tab.personal")} />
              ) : profile.isError || !profile.data ? (
                <ErrorState title={t("profileErrorTitle")} description={t("errorBody")} onRetry={() => void profile.refetch()} />
              ) : (
                <PersonalInformationForm profile={profile.data} />
              )
            ) : null}
          </TabsPanel>
          <TabsPanel value="notifications" className="pt-6">
            {tab === "notifications" ? <NotificationPreferencesForm /> : null}
          </TabsPanel>
          {isSalesman ? (
            <TabsPanel value="bank" className="pt-6">
              {tab === "bank" ? <BankAccountForm /> : null}
            </TabsPanel>
          ) : null}
        </Tabs>
      )}
    </section>
  );
}
