"use client";

// Boosting a published post spends money (FS-MKT-9, MKT-016). The old dialog started with preset
// amounts in USD, never said whether the budget was daily or total, spent on one click, and showed
// a green toast when the platform refused. Now: a daily budget in the ad account's own currency
// times a number of days, the total in words on the button ("Boost for SAR 1,400"), a confirmation
// that names the amount, the account and the post, and a refused boost is shown as refused, with
// the dialog still open.
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Lightning, WarningCircle } from "@phosphor-icons/react";
import {
  Button,
  Checkbox,
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  Combobox,
  ConfirmDialog,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  Input,
  MoneyField,
  NumberField,
  RadioGroup,
  Select,
  Textarea,
  toast,
  useFormatter,
} from "@orgtik/ui";
import { DateTimePicker } from "@orgtik/ui/dates";
import { ISO_COUNTRY_CODES } from "@/constants/countries";
import { platformMeta } from "@/components/shared/PlatformBadge";
import { useProjectContext } from "@/lib/project-context";
import { isolate } from "@/lib/bidi";
import { useBoostPostMutation } from "@/redux/features/boost/boostApi";
import { useGetIntegrationDetailsQuery } from "@/redux/features/integrations/integrationsApi";
import { AdCallToAction, AdObjective, AdPlacement, type AdCurrency, type IBoostPostDTO } from "@/types/boost";
import type { IPostDetail, IPostTarget } from "@/types/post";
import { isFuture } from "../shared/zone";

const META_PLACEMENTS = [
  AdPlacement.FACEBOOK_FEED,
  AdPlacement.FACEBOOK_STORIES,
  AdPlacement.FACEBOOK_REELS,
  AdPlacement.INSTAGRAM_FEED,
  AdPlacement.INSTAGRAM_STORIES,
  AdPlacement.INSTAGRAM_REELS,
  AdPlacement.MESSENGER,
  AdPlacement.AUDIENCE_NETWORK,
];
const YOUTUBE_PLACEMENTS = [AdPlacement.YOUTUBE_HOME, AdPlacement.YOUTUBE_SEARCH, AdPlacement.YOUTUBE_WATCH];
const placementsFor = (platform: string) => (platform === "FACEBOOK" || platform === "INSTAGRAM" ? META_PLACEMENTS : platform === "YOUTUBE" ? YOUTUBE_PLACEMENTS : []);
const defaultPlacements = (platform: string) =>
  platform === "FACEBOOK" ? [AdPlacement.FACEBOOK_FEED] : platform === "INSTAGRAM" ? [AdPlacement.INSTAGRAM_FEED] : platform === "YOUTUBE" ? [AdPlacement.YOUTUBE_HOME] : [];

/** The published targets a boost can promote. */
export const boostableTargets = (post: IPostDetail) => post.targets.filter((x) => x.publishedAt && !x.isDeletedOnPlatform);

type Errors = Partial<Record<"budget" | "days" | "age" | "placements" | "country" | "start" | "url", string>>;

export function BoostDialog({ post, open, onOpenChange }: { post: IPostDetail; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("Boost");
  const f = useFormatter();
  const locale = useLocale();
  const project = useProjectContext();
  const targets = boostableTargets(post);
  const [targetId, setTargetId] = useState<string>(targets[0]?.id ?? "");
  const target: IPostTarget | undefined = targets.find((x) => x.id === targetId) ?? targets[0];
  const platform = target?.platformKey ?? "";

  // The ad account behind the target's connected profile decides the currency.
  const { data: integration } = useGetIntegrationDetailsQuery(target?.integrationId ?? "", { skip: !open || !target?.integrationId });
  const resources = (integration?.data?.accountResources ?? []) as { capability: string; displayName: string; currency: string | null; isSelected: boolean }[];
  const adAccount = resources.find((r) => r.capability === "ADS" && r.isSelected) ?? resources.find((r) => r.capability === "ADS");
  const currency = adAccount?.currency || project.currency;
  const accountName = adAccount?.displayName || target?.integrationPublishPageData?.name || platformMeta(platform).name;

  const [daily, setDaily] = useState<number | null>(null);
  const [days, setDays] = useState<number | null>(7);
  const [objective, setObjective] = useState<AdObjective>(AdObjective.OUTCOME_ENGAGEMENT);
  const [cta, setCta] = useState<AdCallToAction>(AdCallToAction.LEARN_MORE);
  const [country, setCountry] = useState<string | null>(null);
  const [ageMin, setAgeMin] = useState<number | null>(18);
  const [ageMax, setAgeMax] = useState<number | null>(65);
  const [placements, setPlacements] = useState<AdPlacement[]>(defaultPlacements(platform));
  const [headline, setHeadline] = useState("");
  const [primaryText, setPrimaryText] = useState("");
  const [url, setUrl] = useState("");
  const [start, setStart] = useState<"NOW" | "LATER">("NOW");
  const [startAt, setStartAt] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [confirming, setConfirming] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [boost] = useBoostPostMutation();

  useEffect(() => setPlacements(defaultPlacements(platform)), [platform]);
  useEffect(() => {
    if (!open) {
      setErrors({});
      setRefusal(null);
      setConfirming(false);
    }
  }, [open]);

  const countryOptions = useMemo(() => {
    const names = new Intl.DisplayNames(locale, { type: "region" });
    return ISO_COUNTRY_CODES.map((code) => ({ value: code, label: names.of(code) ?? code })).sort((a, b) => a.label.localeCompare(b.label, locale));
  }, [locale]);

  const total = daily && days ? daily * days : 0;
  const totalText = f.money(total, currency);
  const dailyText = f.money(daily ?? 0, currency);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!daily || daily < 1) e.budget = t("errBudget", { min: f.money(1, currency) });
    if (!days || days < 1 || days > 365) e.days = t("errDays");
    if (!ageMin || !ageMax || ageMin < 13 || ageMax > 65 || ageMin > ageMax) e.age = t("errAge");
    if (placementsFor(platform).length && !placements.length) e.placements = t("errPlacements");
    if (!country) e.country = t("errCountry");
    if (start === "LATER" && !isFuture(startAt)) e.start = t("errStart");
    if (url.trim() && !/^https?:\/\/\S+$/i.test(url.trim())) e.url = t("errUrl");
    return e;
  };

  const review = () => {
    const e = validate();
    setErrors(e);
    setRefusal(null);
    if (Object.keys(e).length) return;
    setConfirming(true);
  };

  const send = async () => {
    if (!target || !daily || !days) return;
    const creative = { headline: headline.trim() || undefined, primaryText: primaryText.trim() || undefined, destinationUrl: url.trim() || undefined, actionButtonLabel: cta };
    const body: IBoostPostDTO = {
      unifiedPostTargetId: target.id,
      durationDays: days,
      // A daily budget (contract): the API spends this much a day for durationDays.
      budgetAmount: daily,
      currency: currency as AdCurrency,
      objective,
      callToAction: cta,
      targeting: { geo_locations: { countries: [country!] }, age_min: ageMin!, age_max: ageMax! },
      // Platforms without placement choices place the ad themselves.
      placements: (placements.length ? placements : [platform.toLowerCase()]) as AdPlacement[],
      creativeOverrides: creative,
      platformData: { budgetType: "DAILY", totalBudget: total },
      ...(start === "NOW" ? { startNow: true } : { scheduleAt: startAt! }),
    };
    try {
      const res = await boost(body).unwrap();
      if (res.data?.status === "FAILED") {
        // The API answers 201 when the platform refuses: that is a failure, not a success.
        setRefusal(res.data.errorMessage ? String(res.data.errorMessage) : t("refusedNoReason"));
        toast.error(t("refusedToast"));
        return;
      }
      onOpenChange(false);
    } catch {
      // baseApi's toast says why; the dialog stays open with the values.
      setRefusal(t("failedBody"));
    }
  };

  if (!target) return null;
  const objectiveOptions = Object.values(AdObjective).map((v) => ({ value: v, label: t(`objective_${v}`) }));
  const ctaOptions = Object.values(AdCallToAction).map((v) => ({ value: v, label: t(`cta_${v}`) }));
  const platformName = platformMeta(platform).name;

  return (
    <Dialog open={open} onOpenChange={(next) => !confirming && onOpenChange(next)}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description", { name: isolate(post.title) })}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-5">
          {refusal ? (
            <div role="alert" className="flex items-start gap-2 rounded-field bg-danger-subtle px-3 py-2 text-body-sm text-danger">
              <WarningCircle aria-hidden weight="fill" className="mt-0.5 size-4 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold">{t("refusedTitle", { platform: platformName })}</span>
                <span dir="auto">{refusal}</span>
              </div>
            </div>
          ) : null}

          {targets.length > 1 ? (
            <Field label={t("platformLabel")}>
              <Select value={target.id} onValueChange={(v) => v && setTargetId(v)} options={targets.map((x) => ({ value: x.id, label: platformMeta(x.platformKey).name }))} />
            </Field>
          ) : null}
          <p className="text-body-sm text-fg-muted">{t("account", { account: isolate(accountName), currency })}</p>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("dailyBudget")} required error={errors.budget} description={t("dailyBudgetHint")}>
              <MoneyField currency={currency} value={daily} onValueChange={setDaily} min={1} aria-label={t("dailyBudget")} />
            </Field>
            <Field label={t("days")} required error={errors.days}>
              <NumberField value={days} onValueChange={setDays} min={1} max={365} step={1} aria-label={t("days")} />
            </Field>
          </div>
          <p className="rounded-field bg-sunken px-3 py-2 text-body text-fg" aria-live="polite">
            {total ? t("totalLine", { daily: dailyText, days: days ?? 0, total: totalText }) : t("totalEmpty")}
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("objective")}>
              <Select value={objective} onValueChange={(v) => v && setObjective(v as AdObjective)} options={objectiveOptions} />
            </Field>
            <Field label={t("cta")}>
              <Select value={cta} onValueChange={(v) => v && setCta(v as AdCallToAction)} options={ctaOptions} />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label={t("country")} required error={errors.country} className="md:col-span-1">
              <Combobox options={countryOptions} value={country} onValueChange={setCountry} placeholder={t("countryPlaceholder")} aria-label={t("country")} emptyText={t("noCountry")} />
            </Field>
            <Field label={t("ageFrom")} error={errors.age}>
              <NumberField value={ageMin} onValueChange={setAgeMin} min={13} max={65} aria-label={t("ageFrom")} />
            </Field>
            <Field label={t("ageTo")}>
              <NumberField value={ageMax} onValueChange={setAgeMax} min={13} max={65} aria-label={t("ageTo")} />
            </Field>
          </div>

          {placementsFor(platform).length ? (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-label text-fg">{t("placements")}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {placementsFor(platform).map((p) => (
                  <Checkbox
                    key={p}
                    checked={placements.includes(p)}
                    onCheckedChange={(on) => setPlacements((prev) => (on ? [...prev, p] : prev.filter((x) => x !== p)))}
                    label={t(`placement_${p}`)}
                  />
                ))}
              </div>
              {errors.placements ? (
                <p role="alert" className="text-caption text-danger">
                  {errors.placements}
                </p>
              ) : null}
            </fieldset>
          ) : null}

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-label text-fg">{t("startLabel")}</legend>
            <RadioGroup<"NOW" | "LATER">
              aria-label={t("startLabel")}
              value={start}
              onValueChange={setStart}
              orientation="horizontal"
              options={[
                { value: "NOW", label: t("startNow") },
                { value: "LATER", label: t("startLater") },
              ]}
            />
            {errors.start ? <p className="text-caption text-danger">{errors.start}</p> : null}
          </fieldset>
          {start === "LATER" ? (
            <DateTimePicker value={startAt} onChange={setStartAt} timeZone={project.timeZone} min={new Date().toISOString()} defaultTime="09:00" dateLabel={t("startDate")} timeLabel={t("startTime")} />
          ) : null}

          <Collapsible>
            <CollapsibleTrigger render={<Button variant="ghost" size="sm" />}>{t("adText")}</CollapsibleTrigger>
            <CollapsiblePanel className="flex flex-col gap-4 pt-3">
              <Field label={t("headline")} optional>
                <Input value={headline} onChange={(e) => setHeadline(e.target.value)} dir="auto" maxLength={120} />
              </Field>
              <Field label={t("primaryText")} optional>
                <Textarea value={primaryText} onChange={(e) => setPrimaryText(e.target.value)} dir="auto" rows={3} maxLength={500} />
              </Field>
              <Field label={t("destination")} optional error={errors.url} description={t("destinationHint")}>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} dir="ltr" inputMode="url" placeholder="https://" />
              </Field>
            </CollapsiblePanel>
          </Collapsible>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button variant="primary" startIcon={<Lightning weight="fill" />} onClick={review} disabled={!total}>
            {total ? t("boostFor", { total: totalText }) : t("boost")}
          </Button>
        </DialogFooter>
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          tone="primary"
          title={t("confirmTitle", { total: totalText })}
          impact={t("confirmImpact", {
            total: totalText,
            daily: dailyText,
            days: days ?? 0,
            account: isolate(accountName),
            name: isolate(post.title),
            platform: platformName,
            start: start === "NOW" ? t("confirmStartNow") : startAt ? f.date(startAt, { dateStyle: "medium", timeStyle: "short", timeZone: project.timeZone }) : "",
          })}
          confirmLabel={t("boostFor", { total: totalText })}
          cancelLabel={t("back")}
          onConfirm={send}
        />
      </DialogContent>
    </Dialog>
  );
}
