"use client";

// Step 1: what the post says and where it goes. Platforms are the brand's connected accounts, each
// a real checkbox (the old cards changed only their border). The text is shared or written per
// platform, with each platform's length limit counted as you type.
import { useTranslations } from "next-intl";
import { Checkbox, EmptyState, ErrorState, Field, Input, LoadingState, MultiSelect, Select, Switch, Textarea, useFormatter, cn } from "@orgtik/ui";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { PlatformIcon, platformMeta } from "@/components/shared/PlatformBadge";
import { useMarketingRoles } from "@/lib/permissions";
import { useGetLabelsListQuery } from "@/redux/features/labels/labelsApi";
import { useGetPublishingCampaignsQuery } from "@/redux/features/posts/postsApi";
import type { IPlatform } from "@/types/post";
import { TEXT_LIMITS, textFor, type Draft, type Problems } from "./draft";

type Props = {
  draft: Draft;
  update: (patch: Partial<Draft>) => void;
  problems: Problems;
  show: boolean;
  platforms: IPlatform[];
  platformsStatus: "loading" | "error" | "ready";
  onRetryPlatforms: () => void;
  msg: (p: Problems[string] | undefined) => string | undefined;
};

const FORMATS = ["POST", "REEL", "STORY", "ARTICLE", "VIDEO", "SHORT"];

function Counter({ length, platforms }: { length: number; platforms: string[] }) {
  const t = useTranslations("PostComposer");
  const f = useFormatter();
  const limits = platforms.map((p) => ({ p, max: TEXT_LIMITS[p] })).filter((x) => x.max);
  if (!limits.length) return null;
  const tight = limits.reduce((a, b) => (b.max < a.max ? b : a));
  const over = length > tight.max;
  return (
    <span className={cn("text-caption tabular-nums", over ? "text-danger" : "text-fg-muted")} aria-live="polite">
      {t("counter", { used: f.number(length), max: f.number(tight.max), platform: platformMeta(tight.p).name })}
    </span>
  );
}

export function ContentStep({ draft, update, problems, show, platforms, platformsStatus, onRetryPlatforms, msg }: Props) {
  const t = useTranslations("PostComposer");
  const can = useMarketingRoles();
  const { data: labels } = useGetLabelsListQuery();
  const { data: campaigns } = useGetPublishingCampaignsQuery({});
  const err = (field: string) => (show ? msg(problems[field]) : undefined);

  // Accounts the post already uses stay listed even if they were disconnected since.
  const keys = new Set(platforms.map((p) => p.platform.toUpperCase()));
  const orphan = draft.platforms.filter((p) => !keys.has(p));

  const toggle = (key: string, on: boolean) => {
    const next = on ? [...draft.platforms.filter((p) => p !== key), key] : draft.platforms.filter((p) => p !== key);
    const only = next.length === 1 ? next[0] : null;
    update({
      platforms: next,
      textByPlatform: on && draft.textByPlatform[key] === undefined ? { ...draft.textByPlatform, [key]: draft.text } : draft.textByPlatform,
      // Down to one platform: what it had of its own becomes the shared text and media.
      ...(only && !draft.sameText && draft.textByPlatform[only] !== undefined ? { text: draft.textByPlatform[only] } : {}),
      ...(only && !draft.sameMedia && draft.mediaByPlatform[only] ? { media: draft.mediaByPlatform[only] } : {}),
      ...(only && draft.perPlatformTime && draft.scheduleByPlatform[only] ? { scheduledAt: draft.scheduleByPlatform[only] } : {}),
    });
  };
  const formatLabel = (f: string) => (FORMATS.includes(f) ? t(`format${f}`) : f);

  return (
    <div className="flex flex-col gap-6">
      <Field label={t("titleLabel")} description={t("titleHint")} required error={err("title")}>
        <Input value={draft.title} onChange={(e) => update({ title: e.target.value })} dir="auto" required maxLength={200} />
      </Field>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-label text-fg">
          {t("platformsLabel")}
          <span aria-hidden className="ms-0.5 text-danger">
            *
          </span>
        </legend>
        {platformsStatus === "loading" ? (
          <LoadingState rows={2} label={t("loadingPlatforms")} />
        ) : platformsStatus === "error" ? (
          <ErrorState size="compact" title={t("platformsErrorTitle")} description={t("platformsErrorBody")} onRetry={onRetryPlatforms} />
        ) : !platforms.length && !orphan.length ? (
          <EmptyState
            size="compact"
            title={t("noAccountsTitle")}
            description={can.manageIntegrations ? t("noAccountsBody") : t("noAccountsBodyAsk")}
            action={
              can.manageIntegrations ? (
                <ButtonLink href="/integrations" variant="secondary">
                  {t("connectAccount")}
                </ButtonLink>
              ) : undefined
            }
          />
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {[...platforms.map((p) => ({ key: p.platform.toUpperCase(), account: p.resourceName, handle: p.handleOrCode, formats: p.supportedContentTypes ?? [] })), ...orphan.map((key) => ({ key, account: "", handle: "", formats: [] as string[] }))].map((p) => {
              const on = draft.platforms.includes(p.key);
              return (
                <li key={p.key} className={cn("flex flex-col gap-3 rounded-card border p-3", on ? "border-action-primary bg-brand-subtle" : "border-line bg-raised")}>
                  <Checkbox
                    checked={on}
                    onCheckedChange={(v) => toggle(p.key, Boolean(v))}
                    label={
                      <span className="flex min-w-0 items-center gap-2">
                        <PlatformIcon platform={p.key} className="size-6" />
                        <span className="flex min-w-0 flex-col">
                          <bdi className="text-body font-semibold text-fg">{platformMeta(p.key).name}</bdi>
                          {p.account ? (
                            <span className="truncate text-caption text-fg-muted">
                              <span dir="auto">{p.account}</span>
                              {p.handle ? (
                                <>
                                  {" · "}
                                  <bdi dir="ltr">{p.handle}</bdi>
                                </>
                              ) : null}
                            </span>
                          ) : (
                            <span className="text-caption text-warning">{t("notConnected")}</span>
                          )}
                        </span>
                      </span>
                    }
                  />
                  {on && p.formats.length > 1 ? (
                    <Field label={t("formatFor", { name: platformMeta(p.key).name })}>
                      <Select
                        size="sm"
                        value={draft.formatByPlatform[p.key] ?? p.formats[0]}
                        onValueChange={(v) => v && update({ formatByPlatform: { ...draft.formatByPlatform, [p.key]: v } })}
                        options={p.formats.map((f) => ({ value: f, label: formatLabel(f) }))}
                      />
                    </Field>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        {err("platforms") ? (
          <p role="alert" className="text-body-sm text-danger">
            {err("platforms")}
          </p>
        ) : null}
      </fieldset>

      {draft.platforms.length > 1 ? (
        <Switch
          checked={draft.sameText}
          onCheckedChange={(on) =>
            update(
              on
                ? { sameText: true, text: draft.text || textFor({ ...draft, sameText: false }, draft.platforms[0]) }
                : { sameText: false, textByPlatform: Object.fromEntries(draft.platforms.map((p) => [p, draft.textByPlatform[p] || draft.text])) },
            )
          }
          label={t("sameText")}
          description={draft.sameText ? t("sameTextOn") : t("sameTextOff")}
        />
      ) : null}

      {draft.sameText || draft.platforms.length < 2 ? (
        <Field label={t("textLabel")} required error={err("text")} description={<Counter length={draft.text.length} platforms={draft.platforms} />}>
          <Textarea value={draft.text} onChange={(e) => update({ text: e.target.value })} dir="auto" rows={6} maxRows={16} required />
        </Field>
      ) : (
        draft.platforms.map((p) => (
          <Field
            key={p}
            label={t("textFor", { name: platformMeta(p).name })}
            required
            error={err(`text.${p}`)}
            description={<Counter length={(draft.textByPlatform[p] ?? "").length} platforms={[p]} />}
          >
            <Textarea
              value={draft.textByPlatform[p] ?? ""}
              onChange={(e) => update({ textByPlatform: { ...draft.textByPlatform, [p]: e.target.value } })}
              dir="auto"
              rows={5}
              maxRows={14}
              required
            />
          </Field>
        ))
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("labelsLabel")} optional>
          <MultiSelect
            options={(labels?.data ?? []).map((l) => ({ value: l.id, label: l.name }))}
            value={draft.labelIds}
            onValueChange={(v) => update({ labelIds: v })}
            placeholder={t("labelsPlaceholder")}
            aria-label={t("labelsLabel")}
            emptyText={t("noLabels")}
          />
        </Field>
        <Field label={t("campaignsLabel")} optional description={t("campaignsHint")}>
          <MultiSelect
            options={(campaigns?.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
            value={draft.campaignIds}
            onValueChange={(v) => update({ campaignIds: v })}
            placeholder={t("campaignsPlaceholder")}
            aria-label={t("campaignsLabel")}
            emptyText={t("noCampaigns")}
          />
        </Field>
      </div>
    </div>
  );
}
