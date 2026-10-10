"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, EmptyState, Input, SimulatedTag } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import {
  useMarketingBootstrapQuery,
  useMarketingChangeMutation,
} from "@/redux/features/marketing-v3/marketingApi";
import { writingSchema } from "@/schemas/marketing-v3";
import type { WritingDraft } from "@/types/marketing-v3";
import { useMarketingRoles } from "@/lib/permissions";
import MarketingProjectFrame from "@/components/shared/MarketingProjectFrame";
import { ButtonLink } from "@/components/shared/ButtonLink";
export default function MockWriting() {
  const t = useTranslations("MarketingV3"),
    locale = useLocale(),
    query = useMarketingBootstrapQuery(),
    can = useMarketingRoles(),
    [generate, state] = useMarketingChangeMutation(),
    [draft, setDraft] = useState<WritingDraft>(),
    form = useForm<{ topic: string }>({
      resolver: zodResolver(writingSchema(t)),
      defaultValues: { topic: "" },
    });
  return (
    <MarketingProjectFrame title={t("writing")}>
      <div className="flex items-center gap-3">
        <SimulatedTag />
        <p className="text-body-sm text-fg-muted">{t("providerDeferred")}</p>
      </div>
      {!query.data?.data?.brandKit ? (
        <EmptyState
          title={t("brand")}
          action={<ButtonLink href="/settings/brand">{t("brand")}</ButtonLink>}
        />
      ) : (
        <form
          className="flex max-w-3xl flex-col gap-4"
          onSubmit={form.handleSubmit(async (body) => {
            try {
              const result = (await generate({
                path: "/v3/writing",
                method: "POST",
                body: { ...body, locale },
              }).unwrap()) as WritingDraft;
              setDraft(result);
            } catch {}
          })}
        >
          <RHFField
            control={form.control}
            name="topic"
            label={t("topic")}
            required
            render={(field) => (
              <Input
                {...field}
                dir="auto"
                disabled={!can.editPosts || state.isLoading}
              />
            )}
          />
          {can.editPosts ? (
            <Button
              type="submit"
              className="self-start"
              loading={state.isLoading}
            >
              {t("generate")}
            </Button>
          ) : null}
        </form>
      )}
      {(draft
        ? [draft]
        : query.data?.data?.drafts.slice(-5).reverse() || []
      ).map((row) => (
        <article key={row.id} className="max-w-3xl border-t border-line pt-5">
          <h2 dir="auto" className="font-display text-title-sm">
            {row.headline}
          </h2>
          <p dir="auto" className="mt-3 whitespace-pre-wrap text-body">
            {row.body}
          </p>
          <ButtonLink
            href={`/email-designer?draft=${encodeURIComponent(row.id)}`}
            variant="secondary"
            className="mt-4"
          >
            {t("useDraft")}
          </ButtonLink>
        </article>
      ))}
    </MarketingProjectFrame>
  );
}
