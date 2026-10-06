"use client";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DASHBOARD_LANGUAGES,
  DashboardLanguages,
  WEBSITE_LANGUAGES,
  WebsiteLanguages,
} from "@/constants";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useGetServicesQuery } from "@/redux/features/services/servicesApi";
import ServicesCard from "@/components/pages/services/ServicesCard";
import EditServiceDialog from "@/components/pages/services/EditServiceDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

export default function DemoPage() {
  const t = useTranslations("ServicesPage");
  const [activeLang, setActiveLang] = useState<string>(
    DASHBOARD_LANGUAGES[0].code
  );
  const { data: services, isLoading, isFetching } = useGetServicesQuery();

  const servicesCount = services?.data.items.length || 0;

  return (
    <div className="px-4 space-y-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <EditServiceDialog activeLang={activeLang as WebsiteLanguages}>
          <Button className="rounded-lg">
            <Plus className="w-4 h-4 mr-2" />
            {servicesCount ? t("create_service") : t("create_first_service")}
          </Button>
        </EditServiceDialog>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs
          value={activeLang}
          onValueChange={setActiveLang}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
            {WEBSITE_LANGUAGES.map((lang) => (
              <TabsTrigger
                key={lang.code}
                value={lang.code}
                className="flex items-center gap-1 text-xs"
              >
                <span>
                  <Image
                    src={`/images/flags/${lang.code}.png`}
                    alt={lang.code}
                    width={20}
                    height={20}
                  />
                </span>
                <span className="hidden sm:inline">{lang.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      <>
        {isLoading || isFetching ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:grid lg:grid-cols-2 lg:gap-4 space-y-4 lg:space-y-0"
          >
            {[...Array(5)].map((_, ix) => (
              <Skeleton className={cn("h-[156px]")} />
            ))}
          </motion.div>
        ) : (
          <div className="lg:grid lg:grid-cols-2 lg:gap-4 space-y-4 lg:space-y-0">
            {services?.data.items.map((service: any, ix: number) => (
              <motion.div
                key={service.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: ix * 0.2 + 0.2 }}
              >
                <ServicesCard
                  item={service}
                  activeLang={activeLang as DashboardLanguages}
                />
              </motion.div>
            ))}
          </div>
        )}
      </>
    </div>
  );
}
