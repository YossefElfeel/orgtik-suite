"use client";
import { motion } from "framer-motion";
import SeoForm from "@/components/shared/SeoForm";
import { useTranslations } from "next-intl";

export default function SeoPage() {
  const t = useTranslations("SeoPage");

  return (
    <div className="px-4 space-y-6 pb-8">
      {/* <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
      </motion.div> */}

      <SeoForm />
    </div>
  );
}
