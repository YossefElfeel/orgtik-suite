import { CalendarDots as CalendarDays, LinkSimple as Link2, PencilSimple as Pencil, User as UserRound } from "@phosphor-icons/react";
import { Button } from "@orgtik/ui";
import type { IJobApplicationAppointment } from "@/types/job";
import { useLocale, useTranslations } from "next-intl";

type Props = {
  appointment?: IJobApplicationAppointment | null;
};

function Appointments({ appointment }: Props) {
  const t = useTranslations("jobs");
  const locale = useLocale();
  const hasAppointment = Boolean(appointment);
  const startDate = appointment ? new Date(appointment.startAt) : null;
  const endDate = appointment ? new Date(appointment.endAt) : null;

  const dateLabel = startDate
    ? startDate.toLocaleDateString(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";
  const dayLabel = startDate
    ? startDate.toLocaleDateString(locale, { weekday: "long" })
    : "";
  const timeRange =
    startDate && endDate
      ? `${startDate.toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
        })} - ${endDate.toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      : "-";

  return (
    <section
      className={"flex w-full flex-col gap-4 rounded-2xl border  bg-raised p-6"}
    >
      <div className="flex items-center justify-between gap-4 border-b pb-4">
        <h3 className="text-title-sm leading-6 font-medium ">{t("candidateDetails.appointments")} </h3>
      </div>

      <div className="space-y-3">
        {hasAppointment ? (
          <article className="rounded-xl border bg-gray px-5 py-4">
            <div className="grid gap-4 grid-cols-1  md:grid-cols-3 lg:items-center">
              <div>
                <p className="flex items-center gap-1 text-body text-fg-subtle">
                  <CalendarDays className="size-3.5" />
                  <span>{t("candidateDetails.date")}</span>
                </p>
                <p className="mt-1 text-title-sm font-semibold ">
                  {dateLabel}
                  <span className="ms-0.5 text-body font-normal text-fg-subtle">
                    {dayLabel}
                  </span>
                </p>
                <p className="mt-1 text-body font-normal text-fg-subtle">
                  {timeRange}
                </p>
              </div>

              <div className="md:border-s md:border-e px-4">
                <p className="flex items-center gap-1 text-body text-fg-subtle">
                  <UserRound className="size-3.5 shrink-0" />
                  <span>{t("candidateDetails.interviewWith")}</span>
                </p>
                <p className="mt-1 text-body-lg font-semibold ">
                  {appointment?.interviewWith || "-"}
                </p>
              </div>

              <div>
                <p className="flex items-center gap-1 text-body text-fg-subtle">
                  <Link2 className="size-3.5 shrink-0" />
                  <span>{t("candidateDetails.interviewLink")}</span>
                </p>
                {appointment?.interviewLink ? (
                  <a
                    href={appointment.interviewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block text-body-lg font-semibold text-primary underline-offset-2 hover:underline truncate"
                  >
                    {appointment.interviewLink}
                  </a>
                ) : (
                  <p className="mt-1 text-body-lg font-semibold">-</p>
                )}
              </div>
            </div>
          </article>
        ) : (
          <article className="rounded-xl border bg-gray px-5 py-4">
            <p className="text-body text-fg-subtle">{t("candidateDetails.noAppointmentsYet")}</p>
          </article>
        )}
      </div>
    </section>
  );
}

export default Appointments;
