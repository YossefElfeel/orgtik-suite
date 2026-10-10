"use client";
import { User } from "@phosphor-icons/react";

import { useState } from "react";
import { InfoCard } from "@/components/shared/EmployeeFacts";
import { useTranslations } from "next-intl";
interface AboutSectionProps {
  about?: string;
}

export function AboutSection({ about }: AboutSectionProps) {
  const t = useTranslations("candidateDetails.about");
  const [expanded, setExpanded] = useState(false);
  const aboutText = about?.trim() || "-";

  const limit = 200;
  const isTruncatable = aboutText.length > limit;
  const displayText =
    !expanded && isTruncatable ? `${aboutText.slice(0, limit)}...` : aboutText;

  return (
    <InfoCard title={t("label")} icon={User}>
      <p className="text-sm leading-6 text-secondary">
        <span dir="auto">{displayText}</span>
        {isTruncatable && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="ms-1 font-medium text-primary hover:underline"
          >
            {expanded ? t("showLess") : t("readMore")}
          </button>
        )}
      </p>
    </InfoCard>
  );
}
