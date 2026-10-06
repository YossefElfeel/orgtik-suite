"use client";
// Request a service (USR-17, spec 05): which service, a title, a brief of at least 20 characters,
// and optionally a budget in the workspace currency and a deadline. OrgTik reviews it and sends a
// quote; nothing is charged until the owner accepts and pays. Admins and the owner only.
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { Button, Card, ErrorState, Field, Input, LoadingState, MoneyField, PageHeader, Select, Textarea, toast, useFormatter } from "@orgtik/ui";
import useWorkspace from "@/hooks/use-workspace";
import { useCreateServiceRequestMutation, useGetServicesQuery } from "@/redux/features/platform/services";
import { fieldErrorsOf, useLocalized, usePlatformProblem } from "@/components/workspace/account/problems";
import { Notice } from "@/components/workspace/account/Notice";

export const BRIEF_MIN = 20;
const TITLE_MAX = 100;
const tomorrow = () => {
  const d = new Date(Date.now() + 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function NewRequestForm() {
  const t = useTranslations("Services.new");
  const ts = useTranslations("Services");
  const f = useFormatter();
  const router = useRouter();
  const params = useSearchParams();
  const ws = useWorkspace();
  const name = useLocalized();
  const problem = usePlatformProblem();
  const currency = ws.me?.workspace.currency ?? "USD";
  const { data: services, isLoading, isError, refetch } = useGetServicesQuery();
  const [create, { isLoading: sending }] = useCreateServiceRequestMutation();

  const [serviceId, setServiceId] = useState<string | null>(params.get("service"));
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [budget, setBudget] = useState<number | null>(null);
  const [deadline, setDeadline] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<string | null>(null);

  // The address names the service when the catalogue sent the person here.
  useEffect(() => {
    const wanted = params.get("service");
    if (wanted && services?.some((s) => s.id === wanted)) setServiceId(wanted);
  }, [params, services]);

  const message = (field: string, code?: string) => {
    if (!code) return undefined;
    if (field === "brief") return code === "too_short" ? t("errors.briefShort", { min: BRIEF_MIN }) : t("errors.briefRequired");
    if (field === "title") return code === "too_long" ? t("errors.titleLong", { max: TITLE_MAX }) : t("errors.titleRequired");
    if (field === "serviceId") return t("errors.service");
    if (field === "deadline") return t("errors.deadline");
    return t("errors.invalid");
  };

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!serviceId) e.serviceId = "required";
    if (!title.trim()) e.title = "required";
    else if (title.trim().length > TITLE_MAX) e.title = "too_long";
    if (brief.trim().length < BRIEF_MIN) e.brief = brief.trim() ? "too_short" : "required";
    if (deadline && deadline < tomorrow()) e.deadline = "past";
    setErrors(e);
    setFailed(null);
    if (Object.keys(e).length) return;
    try {
      const r = await create({ serviceId: serviceId!, title: title.trim(), brief: brief.trim(), budget, deadline }).unwrap();
      toast.success(t("sent", { number: r.number }));
      router.push(`/services/requests/${encodeURIComponent(r.id)}`);
    } catch (err) {
      const fe = fieldErrorsOf(err);
      if (Object.keys(fe).length) setErrors(fe);
      else setFailed(problem(err));
    }
  };

  const options = (services ?? []).map((s) => ({
    value: s.id,
    label: s.kind === "package" && s.price ? t("serviceOption", { name: name(s.name), price: f.money(s.price.amount, s.price.currency) }) : t("serviceOptionQuote", { name: name(s.name) }),
  }));
  const length = brief.trim().length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} breadcrumb={[{ label: ts("title"), href: "/services" }, { label: t("title") }]} />
      {isLoading ? (
        <LoadingState rows={5} />
      ) : isError || !services ? (
        <ErrorState title={ts("catalog.failedTitle")} description={ts("catalog.failedBody")} onRetry={refetch} />
      ) : (
        <Card className="max-w-3xl">
          <form
            className="flex flex-col gap-5"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <Field label={t("service")} required error={message("serviceId", errors.serviceId)}>
              <Select options={options} value={serviceId} onValueChange={setServiceId} placeholder={t("servicePlaceholder")} required />
            </Field>
            <Field label={t("requestTitle")} required error={message("title", errors.title)} description={t("titleHint")}>
              <Input value={title} maxLength={TITLE_MAX} onChange={(e) => setTitle(e.target.value)} dir="auto" required />
            </Field>
            <Field label={t("brief")} required error={message("brief", errors.brief)} description={t("briefHint", { min: BRIEF_MIN, count: length })}>
              <Textarea value={brief} rows={6} maxRows={16} onChange={(e) => setBrief(e.target.value)} dir="auto" required />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t("budget")} optional description={t("budgetHint", { currency })}>
                <MoneyField currency={currency} value={budget} onValueChange={setBudget} min={0} />
              </Field>
              <Field label={t("deadline")} optional error={message("deadline", errors.deadline)}>
                <Input type="date" dir="ltr" value={deadline ?? ""} min={tomorrow()} onChange={(e) => setDeadline(e.target.value || null)} />
              </Field>
            </div>
            <Notice tone="info">{t("next")}</Notice>
            {failed ? <Notice tone="danger">{failed}</Notice> : null}
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => router.push("/services")}>
                {t("cancel")}
              </Button>
              <Button type="submit" variant="primary" loading={sending} startIcon={<PaperPlaneRight className="rtl:-scale-x-100" />}>
                {t("submit")}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
