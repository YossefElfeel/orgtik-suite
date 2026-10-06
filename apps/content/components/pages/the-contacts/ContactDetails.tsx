"use client";
import { useTranslations } from "next-intl";

import { useGetContactIdQuery } from "@/redux/features/contacts/contactsApi";
import MainTitle from "@/components/shared/MainTitle";
import Message from "@/components/pages/the-contacts/Message";
import CallSummary from "@/components/pages/the-contacts/CallSummary";
import Status from "@/components/pages/the-contacts/Status";
import ProfileDetails from "@/components/pages/the-contacts/ProfileDetails";

export default function ContactDetails({ id }: { id: number }) {
  const t = useTranslations("ContactsPage");

  const { data, isLoading, isError } = useGetContactIdQuery(id, {
    skip: isNaN(id),
  });

  if (isLoading) return <p>{t("loading")}</p>;
  if (isError || !data) return <p>{t("error_loading")}</p>;
  //mmm
  return (
    <section className="space-y-6">
      <MainTitle
        title={t("details_title")}
        subTitle={t("details_subtitle")}
      />
      <div className="space-y-4">
        <ProfileDetails data={data.data} />
        <Message message={data.data.message} />
        <CallSummary data={data.data} />
        <Status status={data.data.status} id={data?.data.id} />
      </div>
    </section>
  );
}
