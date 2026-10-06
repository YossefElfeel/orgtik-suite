

import { useTranslations } from "next-intl";

type Props = {
  title: string;
};

export function PlanSectionPlaceholder({ title }: Props) {
  const t = useTranslations("planManagement.placeholder");
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("sectionComingSoon")}
      </p>
    </div>
  );
}
