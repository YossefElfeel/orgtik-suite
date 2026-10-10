"use client";
import { CheckCircle as CircleCheck, DownloadSimple as Download, FolderOpen, Lifebuoy as LifeBuoy, Plus, Ticket } from "@phosphor-icons/react";


import { TicketsFiltersBar } from "@/components/pages/home/TicketsFiltersBar";
import { DashboardMetricCard } from "@/components/shared/DashboardMetricCard";
import { TabMenu } from "@/components/shared/TabMenu";
import MainHeader from "@/components/layout/ResourceHeader";
import { Button } from "@orgtik/ui";

export default function HomePage() {
  return (
    <main className="">
      <MainHeader title="Tickets">
        <div className="flex items-center gap-3 ">
          <Button size="lg">
            <Plus className="size-4.5" />
            Add New Ticket
          </Button>
        </div>
      </MainHeader>

      <section className="main-padding">
        <div className="mt-6">
          <TabMenu
            items={[
              {
                key: "support-tickets",
                label: "Support Tickets",
                icon: <LifeBuoy className="size-5" />,
              },
              {
                key: "my-tickets",
                label: "My tickets",
                icon: <Ticket className="size-5" />,
              },
            ]}
          />
        </div>

        <TicketsFiltersBar className="mt-6" />

        <div className="mt-4 grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard
            title="New Tickets"
            value="12,000"
            trend="+67%"
            subtitle="+10 from last week"
          />

          <DashboardMetricCard
            title="Open Tickets"
            value="500"
            trend="+34%"
            subtitle="+10 from last week"
            icon={<FolderOpen className="size-5 text-white" />}
            iconBgClassName="bg-warning-solid"
          />

          <DashboardMetricCard
            title="Solved Ticket"
            value="30 day"
            trend="-9%"
            subtitle="+10 from last week"
            trendDirection="down"
            icon={<CircleCheck className="size-5 text-white" />}
            iconBgClassName="bg-success-solid"
          />

          <DashboardMetricCard
            title="Total Tickets"
            value="500"
            trend="+34%"
            subtitle="+10 from last week"
            icon={<Ticket className="size-5 text-white" />}
            iconBgClassName="bg-info-solid"
          />
        </div>
      </section>
    </main>
  );
}
