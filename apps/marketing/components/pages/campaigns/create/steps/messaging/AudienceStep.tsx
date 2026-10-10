"use client";
import { useEffect, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useTranslations } from "next-intl";
import {
  Badge,
  Checkbox,
  ConnectedFeature,
  ErrorState,
  LoadingState,
  useSuite,
} from "@orgtik/ui";
import {
  useCampaignStepNavigation,
  useStepGuard,
} from "@/hooks/useCampaignStepNavigation";
import {
  useMarketingCampaignQuery,
  useMarketingChangeMutation,
} from "@/redux/features/marketing-v3/marketingApi";
import { useAppDispatch } from "@/redux/app/hooks";
import { setMessagingAudience } from "@/redux/features/campaigns/campaignFormSlice";
import { useMarketingRoles } from "@/lib/permissions";
import type { CanonicalDirectory } from "@/types/marketing-v3";
import { StepFrame } from "../../StepFrame";
export default function MessagingAudienceStep() {
  const t = useTranslations("MarketingV3"),
    suite = useSuite(),
    dispatch = useAppDispatch(),
    can = useMarketingRoles(),
    { campaignId, goNext } = useCampaignStepNavigation(),
    query = useMarketingCampaignQuery(campaignId || skipToken),
    [change, state] = useMarketingChangeMutation(),
    [data, setData] = useState<CanonicalDirectory>(),
    [selected, setSelected] = useState<string[]>([]),
    [error, setError] = useState(false),
    [version, setVersion] = useState(0),
    enabled = suite.canConnect("marketing", "crm");
  useEffect(() => {
    if (query.data)
      setSelected(query.data.recipientRefs.map((r) => r.contactId));
  }, [query.data]);
  useEffect(() => {
    let live = true;
    if (!enabled) return;
    setError(false);
    suite
      .request<CanonicalDirectory>("/crm/directory")
      .then((value) => live && setData(value))
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, [enabled, version, suite.request]);
  const save = async () => {
    if (!campaignId || !data || !selected.length) return false;
    const refs = selected.map((contactId) => ({
      workspaceId: data.workspaceId,
      contactId,
    }));
    try {
      await change({
        path: `/v3/campaigns/${encodeURIComponent(campaignId)}/recipients`,
        method: "PATCH",
        body: { refs },
      }).unwrap();
      dispatch(
        setMessagingAudience({
          sourceType: "CRM",
          crmRecipientRefs: refs,
          audienceId: campaignId,
          audienceLabel: t("contacts"),
          segmentId: "",
          importId: "",
          uploadFileName: "",
          saveAsAudience: false,
        }),
      );
      return true;
    } catch {
      return false;
    }
  };
  useStepGuard(
    JSON.stringify(selected) !==
      JSON.stringify(query.data?.recipientRefs.map((r) => r.contactId) || []),
    save,
  );
  return (
    <StepFrame
      title={t("recipients")}
      description={t("crmHint")}
      busy={state.isLoading}
      nextDisabled={!can.manageAudience || !selected.length || !enabled}
      onSubmit={() => void save().then((ok) => ok && goNext())}
    >
      <ConnectedFeature
        source="marketing"
        requires="crm"
        write={false}
        settingsHref="/admin/connections"
      >
        {error ? (
          <ErrorState
            title={t("loadError")}
            onRetry={() => setVersion((v) => v + 1)}
          />
        ) : !data || query.isLoading ? (
          <LoadingState rows={5} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {data.contacts.map((row) => (
              <li
                key={row.id}
                className="min-w-0 rounded-field border border-line p-3"
              >
                <Checkbox
                  label={
                    <span dir="auto">
                      {row.name} · <bdi dir="ltr">{row.email}</bdi>
                    </span>
                  }
                  checked={selected.includes(row.id)}
                  disabled={!can.manageAudience || state.isLoading}
                  onCheckedChange={(checked) =>
                    setSelected((before) =>
                      checked
                        ? [...before, row.id]
                        : before.filter((id) => id !== row.id),
                    )
                  }
                />
                <Badge
                  className="ms-6 mt-2"
                  tone={
                    row.consent.state === "opted_in"
                      ? "success"
                      : row.consent.state === "opted_out"
                        ? "danger"
                        : "neutral"
                  }
                >
                  {t(row.consent.state)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </ConnectedFeature>
    </StepFrame>
  );
}
