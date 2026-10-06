import { CheckCircle as CircleCheck, FolderOpen, Ticket } from "@phosphor-icons/react";
import { DashboardMetricCard } from "@/components/shared/DashboardMetricCard";
import { useGetTicketStatsQuery } from "@/redux/features/ticket/ticketApi";
import React from "react";
import { useTranslations } from "next-intl";

// Cards the stats API sends, by their stable key; each has a title and a week-over-week line.
const KNOWN_CARDS = ["newTickets", "openTickets", "solvedTickets", "totalTickets"] as const;
type KnownCard = (typeof KNOWN_CARDS)[number];
const isKnownCard = (key: string): key is KnownCard => (KNOWN_CARDS as readonly string[]).includes(key);

type Props = {};

function SupportTicketsCardsSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-xl border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 rounded bg-line animate-pulse" />
            <div className="size-10 rounded-xl bg-line animate-pulse" />
          </div>
          <div className="h-8 w-20 rounded bg-line animate-pulse" />
          <div className="h-4 w-40 rounded bg-sunken animate-pulse" />
        </div>
      ))}
    </>
  );
}

function SupportTicketsCards({}: Props) {
  const t = useTranslations("ticketsPage.stats");
  const { data: ticketStatsData, isLoading: isTicketStatsLoading } =
    useGetTicketStatsQuery();
  const cards = ticketStatsData?.data?.cards ?? [];

  const cardConfigByKey: Record<string, { icon: React.ReactNode; iconBgClassName: string }> = {
    openTickets: {
      icon: <FolderOpen className="size-5 text-white" />,
      iconBgClassName: "bg-warning-solid",
    },
    solvedTickets: {
      icon: <CircleCheck className="size-5 text-white" />,
      iconBgClassName: "bg-success-solid",
    },
    totalTickets: {
      icon: <Ticket className="size-5 text-white" />,
      iconBgClassName: "bg-info-solid",
    },
    newTickets: {
      icon: <Ticket className="size-5 text-primary-foreground" />,
      iconBgClassName: "bg-primary",
    },
  };

  const getTrendProps = (trend?: string) => {
    if (trend === "down") {
      return { trendDirection: "down" as const };
    }

    return { trendDirection: "up" as const };
  };

  if (isTicketStatsLoading) {
    return (
      <div className="mt-6 grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SupportTicketsCardsSkeleton />
      </div>
    );
  }

  return (
    <div className="mt-6 grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const config = cardConfigByKey[card.key] ?? cardConfigByKey.newTickets;
        const isNumberDelta = typeof card.delta === "number";
        const trendValue = isNumberDelta ? `${card.delta > 0 ? "+" : ""}${card.delta}` : "0";
        // Known cards get their words from the catalog (the API's label and subtitle are English);
        // an unknown card keeps what the API sent.
        const known = isKnownCard(card.key) && isNumberDelta;
        const title = known ? t(`${card.key}.title`) : card.label;
        const subtitle = known
          ? t(`${card.key}.delta`, {
              count: Math.abs(card.delta),
              signed: `${card.delta >= 0 ? "+" : ""}${card.delta}`,
            })
          : (card.subtitle ?? "");

        return (
          <DashboardMetricCard
            key={card.key}
            title={title}
            value={card.valueLabel ?? String(card.value ?? 0)}
            trend={trendValue}
            subtitle={subtitle}
            icon={config.icon}
            iconBgClassName={config.iconBgClassName}
            {...getTrendProps(card.trend)}
          />
        );
      })}
    </div>
  );
}

export default SupportTicketsCards;
