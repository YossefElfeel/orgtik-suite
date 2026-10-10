"use client";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Select, Textarea } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import {
  useMarketingBootstrapQuery,
  useMarketingChangeMutation,
} from "@/redux/features/marketing-v3/marketingApi";
import { brandSchema } from "@/schemas/marketing-v3";
import type { BrandKit } from "@/types/marketing-v3";
import { useMarketingRoles } from "@/lib/permissions";
import MarketingProjectFrame from "@/components/shared/MarketingProjectFrame";
export default function BrandSettings() {
  const t = useTranslations("MarketingV3"),
    query = useMarketingBootstrapQuery(),
    can = useMarketingRoles(),
    [save, state] = useMarketingChangeMutation(),
    form = useForm<BrandKit>({
      resolver: zodResolver(brandSchema(t)),
      defaultValues: {
        voice: "warm",
        audience: "",
        proposition: "",
        companyName: "",
        postalAddress: "",
      },
    });
  useEffect(() => {
    if (query.data?.project)
      form.reset(
        query.data.data?.brandKit || {
          voice: "warm",
          audience: "",
          proposition: "",
          companyName: query.data.project.name,
          postalAddress: "",
        },
      );
  }, [query.data, form]);
  return (
    <MarketingProjectFrame title={t("brand")}>
      <form
        className="flex max-w-3xl flex-col gap-5"
        onSubmit={form.handleSubmit(async (body) => {
          try {
            await save({ path: "/v3/brand", method: "PATCH", body }).unwrap();
          } catch {}
        })}
      >
        <RHFField
          control={form.control}
          name="voice"
          label={t("voice")}
          render={(field) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={!can.manageProjects || state.isLoading}
              options={["warm", "direct", "formal"].map((value) => ({
                value,
                label: t(value),
              }))}
            />
          )}
        />
        {(
          ["audience", "proposition", "companyName", "postalAddress"] as const
        ).map((name) => (
          <RHFField
            key={name}
            control={form.control}
            name={name}
            label={t(name)}
            required={name !== "postalAddress"}
            render={(field) =>
              name === "proposition" || name === "postalAddress" ? (
                <Textarea
                  {...field}
                  dir="auto"
                  rows={3}
                  disabled={!can.manageProjects || state.isLoading}
                />
              ) : (
                <Input
                  {...field}
                  dir="auto"
                  disabled={!can.manageProjects || state.isLoading}
                />
              )
            }
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
    </MarketingProjectFrame>
  );
}
