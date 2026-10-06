"use client";

// Who follows the account, as the platform reports it: shares of the audience by country, age and
// gender. Each bar is a labelled Meter, so the value is spoken, not only drawn.
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Card, EmptyState, Meter } from "@orgtik/ui";
import type { IntegrationResponse } from "@/types/integrations";

type Audience = IntegrationResponse["analytics"]["audience"] | undefined;

export function AudiencePanel({ audience }: { audience: Audience }) {
  const t = useTranslations("IntegrationDetail");
  const hasData = audience && audience.status !== "empty" && (audience.topCountries.length > 0 || audience.ageGroups.length > 0);

  if (!hasData) return <EmptyState title={t("audienceEmptyTitle")} description={t("audienceEmptyBody")} />;

  const gender = [
    { label: t("genderFemale"), value: audience.genderSplit?.female ?? 0 },
    { label: t("genderMale"), value: audience.genderSplit?.male ?? 0 },
    { label: t("genderUnknown"), value: audience.genderSplit?.unknown ?? 0 },
  ].filter((g) => g.value > 0);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Group title={t("topCountries")}>
        {audience.topCountries.map((c) => (
          <Meter key={c.label} value={c.value} label={<span dir="auto">{c.label}</span>} />
        ))}
      </Group>
      <Group title={t("ageGroups")}>
        {audience.ageGroups.map((g) => (
          <Meter key={g.label} value={g.value} label={<bdi dir="ltr">{g.label}</bdi>} />
        ))}
      </Group>
      <Group title={t("gender")}>
        {gender.length ? gender.map((g) => <Meter key={g.label} value={g.value} label={g.label} />) : <p className="text-body-sm text-fg-muted">{t("noGender")}</p>}
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card padding="md" className="flex flex-col gap-4">
      <h2 className="font-display text-title-sm text-fg">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </Card>
  );
}
