"use client";

// Step 2: choose what to connect. Each resource is a library Checkbox with its own label, so one
// click is one toggle and Space works from the keyboard (MKT-061: the row and the box both toggled,
// cancelling out, and the keyboard couldn't select). A group allows several picks, as its counter
// says; the server keeps every pick.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Card, Checkbox, Tag, useFormatter } from "@orgtik/ui";
import { usePreflightIntegrationMutation } from "@/redux/features/integrations/integrationsApi";
import { useProjectContext } from "@/lib/project-context";
import type { IWizardSelection } from "@/types/integrations";
import { isolate } from "@/lib/bidi";
import { useCapabilityLabel } from "../shared";
import { updateSession, type ConnectSession } from "./connect-session";

type Picks = Record<string, string[]>;

const picksFrom = (selections: IWizardSelection[]): Picks => Object.fromEntries(selections.map((s) => [s.capability, s.resourceIds]));

export function StepResources({ session, onBack, onCancel, onDone }: { session: ConnectSession; onBack: () => void; onCancel: () => void; onDone: () => void }) {
  const t = useTranslations("ConnectWizard");
  const f = useFormatter();
  const { timeZone } = useProjectContext();
  const capabilityLabel = useCapabilityLabel();
  const [preflight, { isLoading }] = usePreflightIntegrationMutation();
  const [picks, setPicks] = useState<Picks>(() => picksFrom(session.selections));
  const [failed, setFailed] = useState(false);

  const groups = Object.values(session.data.resourceSelection?.groups ?? {}).filter((g) => g.resources.length > 0);
  const chosen = Object.values(picks).reduce((n, ids) => n + ids.length, 0);

  const toggle = (capability: string, id: string, on: boolean) => {
    setPicks((prev) => {
      const list = prev[capability] ?? [];
      const next = on ? (list.includes(id) ? list : [...list, id]) : list.filter((x) => x !== id);
      const out = { ...prev, [capability]: next };
      updateSession(session.tempDataId, { selections: toSelections(out), review: null });
      return out;
    });
  };

  const next = async () => {
    setFailed(false);
    const selections = toSelections(picks);
    try {
      const res = await preflight({ platform: session.platform, tempDataId: session.tempDataId, selections }).unwrap();
      updateSession(session.tempDataId, { selections, review: res.data });
      onDone();
    } catch {
      setFailed(true);
    }
  };

  return (
    <Card padding="lg" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-title text-fg">{t("resourcesTitle")}</h2>
        <p className="text-body text-fg-muted">
          {t("resourcesBody", { name: isolate(session.data.profile?.displayName ?? "") })}
        </p>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-field bg-sunken px-3 py-3 text-body text-fg-muted">{t("noResources")}</p>
      ) : (
        groups.map((g) => {
          const capability = g.resources[0].capability;
          const selected = (picks[capability] ?? []).length;
          return (
            <fieldset key={capability} className="flex flex-col gap-3 rounded-card border border-line p-4">
              <legend className="flex w-full items-center justify-between gap-3 px-1">
                <span className="font-display text-title-sm text-fg">{capabilityLabel(capability)}</span>
              </legend>
              <p className="-mt-1 text-body-sm text-fg-muted">{t("selectedOf", { selected, total: g.resources.length })}</p>
              <ul className="flex flex-col gap-3">
                {g.resources.map((r) => {
                  const checked = (picks[capability] ?? []).includes(r.id);
                  return (
                    <li key={r.id} className="flex items-start justify-between gap-3">
                      <Checkbox
                        checked={checked}
                        disabled={!r.isSelectable}
                        onCheckedChange={(on) => toggle(capability, r.id, Boolean(on))}
                        label={<span dir="auto">{r.displayName}</span>}
                        description={
                          <span className="flex flex-wrap items-center gap-x-2">
                            <span>
                              {t("resourceId")} <bdi dir="ltr">{r.externalId}</bdi>
                            </span>
                            {r.lastSyncedAt ? <span>{t("resourceSeen", { date: f.date(r.lastSyncedAt, { dateStyle: "medium", timeZone }) })}</span> : null}
                            {!r.isSelectable ? <span>{t("notSelectable")}</span> : null}
                          </span>
                        }
                      />
                      {r.currency ? (
                        <Tag className="shrink-0">
                          <bdi dir="ltr">{r.currency}</bdi>
                        </Tag>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          );
        })
      )}

      {failed ? (
        <p role="alert" className="rounded-field bg-danger-subtle px-3 py-2 text-body-sm text-danger">
          {t("preflightFailed")}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
          {t("cancel")}
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {chosen === 0 ? <span className="text-body-sm text-fg-muted">{t("pickOne")}</span> : null}
          <Button variant="secondary" onClick={onBack} disabled={isLoading}>
            {t("back")}
          </Button>
          <Button variant="primary" loading={isLoading} disabled={chosen === 0} onClick={next}>
            {t("next")}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function toSelections(picks: Picks): IWizardSelection[] {
  return Object.entries(picks)
    .filter(([, ids]) => ids.length > 0)
    .map(([capability, resourceIds]) => ({ capability, resourceIds }));
}
