"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useGetSubServiceByIdQuery } from "@/redux/features/sub-services/subServicesApi";
import { Skeleton } from "@/components/ui/skeleton";
import SubServiceForm from "@/components/pages/sub-services/SubServiceForm";
import { WEBSITE_LANGUAGES, WebsiteLanguages } from "@/constants";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function SubServiceFormPage() {
  const t = useTranslations("SubServicesPage");
  const params = useParams();
  const router = useRouter();
  const serviceId = Number(params.serviceId);
  const id = params.id as string;
  const isEditMode = id !== "new";
  const subServiceId = isEditMode ? Number(id) : undefined;
  const [activeLang, setActiveLang] = useState<WebsiteLanguages>(
    WEBSITE_LANGUAGES[0].code as WebsiteLanguages
  );

  const {
    data: subServiceData,
    isLoading,
    isError,
  } = useGetSubServiceByIdQuery(subServiceId!, {
    skip: !isEditMode,
  });

  if (isLoading) {
    return (
      <div className="px-4 space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (isEditMode && (isError || !subServiceData)) {
    return (
      <div className="px-4">
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("not_found")}</p>
          <Link href={`/services/${serviceId}/sub-services`}>
            <Button className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("back_to_sub_services")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const subService = isEditMode ? subServiceData?.data : undefined;

  return (
    <div className="px-4 space-y-6 pb-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? t("edit_title") : t("create_title")}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? t("edit_description") : t("create_description")}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <SubServiceForm
          item={subService}
          serviceId={serviceId}
          activeLang={activeLang}
          onSuccess={() => {
            router.push(`/services/${serviceId}/sub-services`);
          }}
        />
      </motion.div>
    </div>
  );
}
