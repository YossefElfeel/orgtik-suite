"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, ErrorState, Field, Input, LoadingState } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { useMarketingRoles } from "@/lib/permissions";
import {
  useMarketingChangeMutation,
  useMarketingUtmDefaultsQuery,
} from "@/redux/features/marketing-v3/marketingApi";
import MarketingProjectFrame from "@/components/shared/MarketingProjectFrame";

type Defaults = { source: string; medium: string; campaign: string };
export default function UtmSettings() {
  const t = useTranslations("MarketingV3"),
    query = useMarketingUtmDefaultsQuery(),
    can = useMarketingRoles(),
    [save, state] = useMarketingChangeMutation();
  const [address, setAddress] = useState("");
  const form = useForm<Defaults>({
    resolver: zodResolver(
      z.object({
        source: z.string().trim().max(120, t("tooLong")),
        medium: z.string().trim().max(120, t("tooLong")),
        campaign: z.string().trim().max(120, t("tooLong")),
      }),
    ),
    defaultValues: { source: "", medium: "", campaign: "" },
  });
  useEffect(() => {
    if (query.data) form.reset(query.data.settings);
  }, [query.data, form]);
  let generated = "";
  if (address && query.data) {
    try {
      const url = new URL(address);
      if (
        ["http:", "https:"].includes(url.protocol) &&
        !url.username &&
        !url.password &&
        address.length <= 2000
      ) {
        for (const key of ["source", "medium", "campaign"] as const) {
          const value = query.data.settings[key];
          if (value) url.searchParams.set(`utm_${key}`, value);
          else url.searchParams.delete(`utm_${key}`);
        }
        generated = url.toString();
      }
    } catch {}
  }
  return (
    <MarketingProjectFrame title={t("utmSettings")}>
      <p className="max-w-prose text-body-sm text-fg-muted">{t("utmHint")}</p>
      {query.isError ? (
        <ErrorState
          title={t("loadError")}
          onRetry={() => void query.refetch()}
        />
      ) : query.isLoading ? (
        <LoadingState rows={3} />
      ) : (
        <>
          <form
            className="flex max-w-3xl flex-col gap-4"
            onSubmit={form.handleSubmit(async (body) => {
              try {
                await save({ path: "/v3/utm", method: "PATCH", body }).unwrap();
              } catch {}
            })}
          >
            {(["source", "medium", "campaign"] as const).map((name) => (
              <RHFField
                key={name}
                control={form.control}
                name={name}
                label={t(
                  name === "source"
                    ? "utmSource"
                    : name === "medium"
                      ? "utmMedium"
                      : "utmCampaign",
                )}
                render={(field) => (
                  <Input
                    {...field}
                    dir="auto"
                    disabled={!can.manageProjects || state.isLoading}
                  />
                )}
              />
            ))}
            {can.manageProjects ? (
              <Button
                type="submit"
                className="self-start"
                loading={state.isLoading}
              >
                {t("save")}
              </Button>
            ) : null}
          </form>
          <section className="flex max-w-3xl flex-col gap-4 border-t border-line pt-5">
            <h3 className="text-body font-semibold">{t("utmLinkBuilder")}</h3>
            <Field
              label={t("utmPageAddress")}
              error={address && !generated ? t("utmInvalidAddress") : undefined}
            >
              <Input
                type="url"
                dir="ltr"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </Field>
            {generated ? (
              <Field label={t("utmTaggedAddress")}>
                <Input dir="ltr" value={generated} readOnly />
              </Field>
            ) : null}
            <p className="text-body-sm text-fg-muted">
              {t("utmSavedDefaults")}
            </p>
          </section>
        </>
      )}
    </MarketingProjectFrame>
  );
}
