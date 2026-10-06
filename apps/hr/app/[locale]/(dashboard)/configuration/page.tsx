"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { InnerHeader } from "@/components/layout/InnerHeader";
import ConfigurationForm from "@/components/pages/configuration/ConfigurationForm";
import MainHeader from "@/components/layout/MainHeader";

const ConfigurationPage = () => {
  const t = useTranslations("configuration");

  return (
    <div>
      <MainHeader
        title={t("pageTitle")}
      />
      <div className="main-padding">
        <ConfigurationForm />
      </div>
    </div>
  );
};

export default ConfigurationPage;
