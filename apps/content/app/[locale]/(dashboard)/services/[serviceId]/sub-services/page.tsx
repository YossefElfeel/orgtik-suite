"use client";

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WEBSITE_LANGUAGES, WebsiteLanguages } from "@/constants";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useGetSubServicesByServiceQuery } from "@/redux/features/sub-services/subServicesApi";
import { useGetServicesQuery } from "@/redux/features/services/servicesApi";
import SubServiceCard from "@/components/pages/sub-services/SubServiceCard";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function SubServicesPage() {
  const t = useTranslations("SubServicesPage");
  const params = useParams();
  const serviceId = Number(params.serviceId);

  const [activeLang, setActiveLang] = useState<string>(
    WEBSITE_LANGUAGES[0].code,
  );

  const {
    data: subServices,
    isLoading,
    isFetching,
  } = useGetSubServicesByServiceQuery(serviceId);
  const { data: services } = useGetServicesQuery();

  const service = services?.data.items.find((s) => s.id === serviceId);
  const subServicesCount = subServices?.data.length || 0;

  return (
    <div className="px-4 space-y-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/services">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t("back_to_services")}
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {service?.title[activeLang as WebsiteLanguages] || t("title")}
          </h1>
          <p className="text-muted-foreground">{t("manage_sub_services")}</p>
        </div>
        <Link href={`/services/${serviceId}/sub-services/new`}>
          <Button className="rounded-lg">
            <Plus className="w-4 h-4 mr-2" />
            {subServicesCount
              ? t("create_sub_service")
              : t("create_first_sub_service")}
          </Button>
        </Link>
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
            {[...Array(4)].map((_, ix) => (
              <Skeleton key={ix} className={cn("h-[200px]")} />
            ))}
          </motion.div>
        ) : subServicesCount === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <p className="text-muted-foreground text-lg mb-4">
              {t("no_sub_services")}
            </p>
          </motion.div>
        ) : (
          <div className="lg:gap-4 space-y-4">
            {subServices?.data.map((subService: any, ix: number) => (
              <motion.div
                key={subService.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: ix * 0.2 + 0.2 }}
              >
                <SubServiceCard
                  item={subService}
                  activeLang={activeLang as WebsiteLanguages}
                />
              </motion.div>
            ))}
          </div>
        )}
      </>
    </div>
  );
}
