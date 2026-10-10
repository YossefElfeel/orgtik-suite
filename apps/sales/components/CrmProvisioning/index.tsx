"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, ErrorState, Input, LoadingState, useSuite } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { isolate } from "@/lib/bidi";
import { openSuiteDestination } from "@/lib/suite-navigation";
import { crmProvisioningSchema } from "@/schemas/crm-v3";
import type {
  CrmProvisioningCandidate,
  CrmProvisioningReceipt,
} from "@/types/crm-v3";
export default function CrmProvisioning({ id }: { id: string }) {
  const t = useTranslations("CrmV3"),
    te = useTranslations("Errors"),
    suite = useSuite(),
    [candidate, setCandidate] = useState<CrmProvisioningCandidate>(),
    [receipt, setReceipt] = useState<CrmProvisioningReceipt>(),
    [error, setError] = useState(false),
    [busy, setBusy] = useState(false),
    [navigationError, setNavigationError] = useState(false),
    operation = useRef<string | undefined>(undefined),
    form = useForm<{ name: string; country: string }>({
      resolver: zodResolver(crmProvisioningSchema(t)),
      defaultValues: { name: "", country: "CH" },
    });
  const authority = `${suite.snapshot?.workspace.id}:${suite.snapshot?.actor.effectiveUserId}`,
    allowed =
      suite.snapshot?.workspace.kind === "orgtik_internal" &&
      Boolean(suite.toolState("crm")?.canWrite) &&
      suite
        .toolState("crm")
        ?.roles.some((role) => ["admin", "manager"].includes(role)) &&
      !suite.snapshot?.actor.readOnly;
  const load = async () => {
    setError(false);
    try {
      const result = await suite.request<CrmProvisioningCandidate>(
        `/crm/projects/${encodeURIComponent(id)}/provisioning`,
      );
      setCandidate(result);
      setReceipt(result.receipt || undefined);
      form.reset({
        name: result.customer?.companyName || result.customer?.name || "",
        country: "CH",
      });
    } catch {
      setError(true);
    }
  };
  useEffect(() => {
    setCandidate(undefined);
    setReceipt(undefined);
    operation.current = undefined;
    if (allowed) void load();
  }, [id, authority, allowed]);
  if (!allowed) return null;
  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-raised p-4 sm:p-5">
      <h2 className="font-display text-title-sm">{t("provisioningTitle")}</h2>
      <p className="text-body-sm text-fg-muted">{t("provisioningHint")}</p>
      {error ? (
        <ErrorState
          size="compact"
          title={t("provisioningError")}
          onRetry={() => void load()}
        />
      ) : !candidate ? (
        <LoadingState rows={2} />
      ) : receipt?.state === "provisioned" ? (
        <div role="status">
          <p dir="auto" className="text-body font-semibold">
            {receipt.workspaceName}
          </p>
          <p className="mt-1 text-body-sm text-success">
            {t("workspaceReady")}
          </p>
          <a
            href={`${suite.sosUrl}/go/platform_admin?redirect=${encodeURIComponent(`/workspaces/${receipt.workspaceId}`)}`}
            className="mt-3 inline-block text-body-sm text-fg-brand underline"
            onClick={(event) => { event.preventDefault(); setNavigationError(false); void openSuiteDestination(event.currentTarget.href).catch(() => setNavigationError(true)); }}
          >
            {t("openWorkspace")}
          </a>
          {navigationError ? <p role="alert" className="mt-2 text-body-sm text-danger">{te("handoffUnavailable")}</p> : null}
        </div>
      ) : !candidate.canProvision ? (
        <p className="text-body-sm text-fg-muted">
          {t("provisioningPermission")}
        </p>
      ) : !candidate.won ? (
        <p className="text-body-sm text-fg-muted">
          {t("confirmContractFirst")}
        </p>
      ) : (
        <>
          {receipt?.state === "awaiting_owner_signup" ? (
            <div role="status" className="rounded-field bg-sunken p-3">
              <p className="text-body-sm">
                {t("ownerSignupNeeded", { email: isolate(receipt.email) })}
              </p>
              <a
                href={`${suite.sosUrl}${receipt.signupPath}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-body-sm text-fg-brand underline"
              >
                {t("openSignup")}
              </a>
            </div>
          ) : null}
          <form
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit(async (values) => {
              setBusy(true);
              setError(false);
              try {
                operation.current ||= crypto.randomUUID();
                const result = await suite.mutate<CrmProvisioningReceipt>(
                  `/crm/projects/${encodeURIComponent(id)}/provision`,
                  "POST",
                  { ...values, operationId: operation.current },
                );
                setReceipt(result);
              } catch {
                setError(true);
              } finally {
                setBusy(false);
              }
            })}
          >
            <RHFField
              control={form.control}
              name="name"
              label={t("workspaceName")}
              required
              render={(field) => (
                <Input {...field} dir="auto" disabled={busy} />
              )}
            />
            <RHFField
              control={form.control}
              name="country"
              label={t("countryCode")}
              required
              render={(field) => (
                <Input {...field} dir="ltr" maxLength={2} disabled={busy} />
              )}
            />
            <Button type="submit" loading={busy}>
              {t(
                receipt?.state === "awaiting_owner_signup"
                  ? "retryProvisioning"
                  : "createCustomerWorkspace",
              )}
            </Button>
          </form>
        </>
      )}
    </section>
  );
}
