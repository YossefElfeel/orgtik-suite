"use client";

// The campaign wizard's state, from the address and the saved draft only.
// - The campaign is the address's ?id= (MKT-009). Redux values held for another campaign are dropped
//   when the id changes, and all of them when the wizard closes.
// - A step's state comes from what the server has saved (lib/campaigns/workflow), so a reached step
//   stays reachable and an unreached one is locked (MKT-043).
// - Leaving a step with unsaved edits (Back, the stepper, Cancel) asks to save or discard (MKT-012).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { skipToken } from "@reduxjs/toolkit/query";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@orgtik/ui";
import { useRouter } from "@/i18n/routing";
import { useAppDispatch } from "@/redux/app/hooks";
import { enterCampaign, resetForm } from "@/redux/features/campaigns/campaignFormSlice";
import { useGetCampaignQuery } from "@/redux/features/campaigns/campaignsApi";
import { buildCampaignNewPath, objectiveToSlug, resolveCampaignNewPath } from "@/lib/campaigns/routing";
import { API_TYPE_TO_OBJECTIVE, getCampaignStepIds, isStepComplete, type CampaignStepId } from "@/lib/campaigns/workflow";
import type { CampaignObjective } from "@/types/campaignTypes";
import type { ICreatedCampaign } from "@/types/campaigns";
import type { StepState } from "@orgtik/ui";

type Guard = { dirty: boolean; save: () => Promise<boolean> };

interface CampaignWizard {
  objective: CampaignObjective;
  stepId: CampaignStepId;
  stepIndex: number;
  steps: CampaignStepId[];
  stepStates: StepState[];
  campaignId: string | null;
  campaign: ICreatedCampaign | undefined;
  campaignStatus: "none" | "loading" | "ready" | "error" | "notFound";
  /** A save just changed the campaign and its fresh copy is on the way. */
  isRefreshing: boolean;
  refetchCampaign: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  /** Opens a step, asking first when the current one has unsaved edits. */
  goToStep: (step: CampaignStepId) => void;
  /** After a successful save: the next step (of this or another type), with the campaign's id. */
  goNext: (options?: { campaignId?: string; objective?: CampaignObjective }) => void;
  goBack: () => void;
  /** Leaves the wizard for a page, asking first when there are unsaved edits (unless force). */
  leave: (href: string, force?: boolean) => void;
  /** Shows another type's steps for a draft that isn't saved yet. */
  replaceObjective: (objective: CampaignObjective) => void;
  /** Each step tells the wizard whether it has unsaved edits and how to save them. */
  setGuard: (guard: Guard | null) => void;
  isDirty: boolean;
}

const Ctx = createContext<CampaignWizard | null>(null);

export function CampaignStepNavigationProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("CampaignWizard");
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const typeSlug = params.type as string | undefined;
  const stepSlug = params.step as string | undefined;
  const campaignId = searchParams.get("id");
  const resolved = useMemo(() => resolveCampaignNewPath(typeSlug, stepSlug), [typeSlug, stepSlug]);
  const steps = useMemo(() => getCampaignStepIds(resolved.objective), [resolved.objective]);

  const query = useGetCampaignQuery(campaignId ?? skipToken);
  const campaign = campaignId ? query.data?.data : undefined;
  const errStatus = (query.error as { status?: number } | undefined)?.status;
  const campaignStatus: CampaignWizard["campaignStatus"] = !campaignId
    ? "none"
    : query.isLoading
      ? "loading"
      : query.isError
        ? errStatus === 404 || errStatus === 403
          ? "notFound"
          : "error"
        : campaign
          ? "ready"
          : "loading";

  // The address decides which campaign these values belong to.
  useEffect(() => {
    dispatch(enterCampaign(campaignId));
  }, [campaignId, dispatch]);
  // Closing the wizard keeps nothing for the next visit.
  useEffect(() => () => void dispatch(resetForm()), [dispatch]);

  useEffect(() => {
    if (typeSlug && stepSlug && !resolved.isCanonical) router.replace(buildCampaignNewPath(resolved.typeSlug, resolved.stepSlug, campaignId));
  }, [typeSlug, stepSlug, resolved, campaignId, router]);

  // A saved campaign opens in its own type's steps, whatever type the link named.
  const savedObjective = campaign ? API_TYPE_TO_OBJECTIVE[campaign.type] : null;
  useEffect(() => {
    if (!savedObjective || savedObjective === resolved.objective) return;
    const list = getCampaignStepIds(savedObjective);
    const step = list.includes(resolved.stepSlug) ? resolved.stepSlug : "details";
    router.replace(buildCampaignNewPath(objectiveToSlug(savedObjective), step, campaignId));
  }, [savedObjective, resolved.objective, resolved.stepSlug, campaignId, router]);

  const guardRef = useRef<Guard | null>(null);
  const [isDirty, setDirty] = useState(false);
  const setGuard = useCallback((g: Guard | null) => {
    guardRef.current = g;
    setDirty(Boolean(g?.dirty));
  }, []);

  // Closing the tab or reloading with unsaved edits: the browser asks.
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const [pending, setPending] = useState<null | (() => void)>(null);
  const [saving, setSaving] = useState(false);
  const guarded = useCallback((go: () => void) => {
    if (guardRef.current?.dirty) setPending(() => go);
    else go();
  }, []);

  const path = useCallback((step: CampaignStepId, objective: CampaignObjective = resolved.objective, id: string | null = campaignId) => buildCampaignNewPath(objectiveToSlug(objective), step, id), [resolved.objective, campaignId]);

  const goToStep = useCallback((step: CampaignStepId) => guarded(() => router.push(path(step))), [guarded, router, path]);
  const goNext = useCallback(
    (options?: { campaignId?: string; objective?: CampaignObjective }) => {
      const objective = options?.objective ?? resolved.objective;
      const list = getCampaignStepIds(objective);
      const next = list[Math.min(resolved.stepIndex + 1, list.length - 1)];
      guardRef.current = null;
      setDirty(false);
      router.push(path(next, objective, options?.campaignId ?? campaignId));
    },
    [resolved.objective, resolved.stepIndex, router, path, campaignId],
  );
  const goBack = useCallback(() => {
    if (resolved.stepIndex > 0) goToStep(steps[resolved.stepIndex - 1]);
  }, [resolved.stepIndex, steps, goToStep]);
  const leave = useCallback(
    (href: string, force?: boolean) => {
      if (!force) return guarded(() => router.push(href));
      guardRef.current = null;
      setDirty(false);
      router.push(href);
    },
    [guarded, router],
  );
  const replaceObjective = useCallback((objective: CampaignObjective) => router.replace(path(steps[resolved.stepIndex] ?? "details", objective)), [router, path, steps, resolved.stepIndex]);

  // complete: saved; current: open; error: an earlier step that still misses data; upcoming: locked
  // until every step before it is saved.
  const stepStates = useMemo<StepState[]>(() => {
    let blocked = false;
    return steps.map((s, i) => {
      const done = isStepComplete(s, campaign);
      let state: StepState;
      if (i === resolved.stepIndex) state = "current";
      else if (i < resolved.stepIndex) state = done ? "complete" : "error";
      else state = !blocked && (done || (s === "review" && campaign?.isComplete)) ? "complete" : "upcoming";
      if (i !== resolved.stepIndex && !done) blocked = true;
      if (i === resolved.stepIndex && !done) blocked = true;
      return state;
    });
  }, [steps, campaign, resolved.stepIndex]);

  const value: CampaignWizard = {
    objective: resolved.objective,
    stepId: resolved.stepSlug,
    stepIndex: resolved.stepIndex,
    steps,
    stepStates,
    campaignId,
    campaign,
    campaignStatus,
    isRefreshing: Boolean(campaignId) && query.isFetching,
    refetchCampaign: () => void query.refetch(),
    isFirstStep: resolved.stepIndex === 0,
    isLastStep: resolved.stepIndex === steps.length - 1,
    goToStep,
    goNext,
    goBack,
    leave,
    replaceObjective,
    setGuard,
    isDirty,
  };

  const close = () => setPending(null);
  const discard = () => {
    const go = pending;
    guardRef.current = null;
    setDirty(false);
    close();
    go?.();
  };
  const saveAndGo = async () => {
    const go = pending;
    const save = guardRef.current?.save;
    if (!save) return discard();
    setSaving(true);
    try {
      const ok = await save();
      if (!ok) return close();
      guardRef.current = null;
      setDirty(false);
      close();
      go?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <Dialog open={pending !== null} onOpenChange={(o) => (!o && !saving ? close() : undefined)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{t("leave.title")}</DialogTitle>
            <DialogDescription>{t("leave.body")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={close} disabled={saving}>
              {t("leave.keepEditing")}
            </Button>
            <Button variant="secondary" onClick={discard} disabled={saving}>
              {t("leave.discard")}
            </Button>
            <Button variant="primary" loading={saving} onClick={() => void saveAndGo()}>
              {t("leave.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}

export function useCampaignStepNavigation(): CampaignWizard {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCampaignStepNavigation must be used inside CampaignStepNavigationProvider");
  return ctx;
}

/** A step reports its unsaved edits and how to save them, for the leave prompt. */
export function useStepGuard(dirty: boolean, save: () => Promise<boolean>) {
  const { setGuard } = useCampaignStepNavigation();
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    setGuard({ dirty, save: () => saveRef.current() });
  }, [dirty, setGuard]);
  useEffect(() => () => setGuard(null), [setGuard]);
}
