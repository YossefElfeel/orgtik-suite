"use client";

// The post composer (FS-MKT-7) for a new post and for Edit. Three steps (Content, Media,
// Schedule) on the Stepper; each step is checked before the next opens, and a reached step can be
// opened again from the step row (MKT-013: no step was checked, and the last button's label
// didn't match what it did). Leaving with unsaved changes asks first, and so does closing the tab.
// When it is saved it opens the post, instead of resetting to a blank step 1.
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { Button, Card, ConfirmDialog, PageHeader, Stepper, type Step } from "@orgtik/ui";
import { useRouter } from "@/i18n/routing";
import { platformMeta } from "@/components/shared/PlatformBadge";
import { useProjectContext } from "@/lib/project-context";
import {
  useAddReviewerMutation,
  useAddTargetMutation,
  useCreateNewPostMutation,
  useDeleteTargetMutation,
  useGetAvailablePlatformsQuery,
  usePublishNowMutation,
  useUpdatePostMutation,
  useUpdateTargetMediaMutation,
} from "@/redux/features/posts/postsApi";
import type { IPostDetail, IUpdatePostDTO } from "@/types/post";
import { ContentStep } from "./ContentStep";
import { MediaStep } from "./MediaStep";
import { ScheduleStep } from "./ScheduleStep";
import { STEPS, check, emptyDraft, firstTime, fromPost, limitsOf, mediaFor, mediaRequired, scheduleFor, sharedText, textFor, toCreateBody, type Draft, type Problems, type StepId } from "./draft";

export function PostComposer({ post }: { post?: IPostDetail }) {
  const t = useTranslations("PostComposer");
  const locale = useLocale();
  const router = useRouter();
  const { timeZone } = useProjectContext();
  const editing = Boolean(post);
  const [draft, setDraft] = useState<Draft>(() => (post ? fromPost(post) : emptyDraft()));
  const initial = useRef(JSON.stringify(draft));
  const [step, setStep] = useState<StepId>("content");
  const [reached, setReached] = useState(editing ? STEPS.length - 1 : 0);
  const [shown, setShown] = useState<Partial<Record<StepId, boolean>>>({});
  const [busy, setBusy] = useState(false);
  /** Where the person was going when we stopped to ask about unsaved changes. */
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  const saved = useRef(false);

  const platformsQuery = useGetAvailablePlatformsQuery();
  const platforms = platformsQuery.data?.data ?? [];
  const limits = useMemo(() => limitsOf(platforms), [platforms]);
  const name = (p: string) => platformMeta(p).name;

  const [createPost] = useCreateNewPostMutation();
  const [publishNow] = usePublishNowMutation();
  const [updatePost] = useUpdatePostMutation();
  const [addTarget] = useAddTargetMutation();
  const [deleteTarget] = useDeleteTargetMutation();
  const [updateTarget] = useUpdateTargetMediaMutation();
  const [setReviewers] = useAddReviewerMutation();

  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const dirty = JSON.stringify(draft) !== initial.current;

  // Closing or reloading the tab with unsaved work asks the browser to confirm.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      if (saved.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    // A link inside the app (the breadcrumb, the sidebar) asks too, before it navigates.
    const onClick = (e: MouseEvent) => {
      if (saved.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      setLeaveTo(url.pathname + url.search);
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  const problems = useMemo(() => {
    const out = Object.fromEntries(STEPS.map((s) => [s, check(s, draft, limits, name)])) as Record<StepId, Problems>;
    if (editing && draft.approvers.length && draft.mode === "PUBLISH_NOW") out.schedule.mode = { key: "errNowBlocked" };
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, limits, editing]);
  const msg = (p: Problems[string] | undefined) => (p ? t(p.key, p.values) : undefined);
  const hasProblems = (s: StepId) => Object.keys(problems[s]).length > 0;

  const index = STEPS.indexOf(step);
  const labels: Record<StepId, string> = { content: t("stepContent"), media: t("stepMedia"), schedule: t("stepSchedule") };
  const steps: Step[] = STEPS.map((s, i) => ({
    id: s,
    label: labels[s],
    // The stepper said "Optional" while Instagram refused to go on without an image.
    optional: s === "media" && !mediaRequired(draft.platforms),
    state: s === step ? "current" : i > reached ? "upcoming" : shown[s] && hasProblems(s) ? "error" : "complete",
  }));

  const focusFirstError = () =>
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>("[data-composer] [aria-invalid='true'], [data-composer] [role='alert']");
      el?.focus?.();
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    });

  const go = (to: StepId) => {
    setStep(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const next = () => {
    if (hasProblems(step)) {
      setShown((s) => ({ ...s, [step]: true }));
      focusFirstError();
      return;
    }
    const to = STEPS[index + 1];
    setReached((r) => Math.max(r, index + 1));
    go(to);
  };

  const leave = (to: string) => {
    saved.current = true;
    // Paths read from links carry the language; the router adds it itself.
    router.push(to.replace(/^\/(en|ar|de|fr|it)(?=\/|$|\?)/, "") || "/");
  };
  const home = post ? `/posts/${post.id}` : "/posts";
  const cancel = () => (dirty ? setLeaveTo(home) : leave(home));

  const saveNew = async () => {
    const body = toCreateBody(draft);
    const res = await createPost(body).unwrap();
    const id = res.data?.id;
    if (draft.mode === "PUBLISH_NOW" && !draft.approvers.length && id) {
      // Saved first, then published: if the platform refuses, the post is kept and its page says why.
      await publishNow(id)
        .unwrap()
        .catch(() => undefined);
    }
    return id;
  };

  const saveExisting = async (p: IPostDetail) => {
    const before = new Map(p.targets.map((x) => [x.platformKey, x]));
    for (const x of p.targets) if (!draft.platforms.includes(x.platformKey)) await deleteTarget({ postId: p.id, targetId: x.id }).unwrap();
    const ids = new Map<string, string>([...before].map(([k, v]) => [k, v.id]));
    for (const key of draft.platforms) {
      if (ids.has(key)) continue;
      const res = await addTarget({ postId: p.id, target: { platform: key, ...(draft.formatByPlatform[key] ? { contentType: draft.formatByPlatform[key] } : {}) } }).unwrap();
      const added = res.data?.targets?.find((x) => x.platformKey === key);
      if (added) ids.set(key, added.id);
    }
    const scheduled = draft.mode === "SCHEDULED";
    for (const key of draft.platforms) {
      const targetId = ids.get(key);
      if (!targetId) continue;
      const old = before.get(key);
      const media = mediaFor(draft, key).map((m) => m.id);
      const oldMedia = old?.galleryIds ?? [];
      const when = scheduled ? scheduleFor(draft, key) : null;
      await updateTarget({
        postId: p.id,
        targetId,
        body: {
          text: sharedText(draft) ? "" : textFor(draft, key),
          ...(draft.formatByPlatform[key] ? { contentType: draft.formatByPlatform[key] } : {}),
          galleryIds: media.filter((m) => !oldMedia.includes(m)),
          galleryIdsToRemove: oldMedia.filter((m) => !media.includes(m)),
          ...(when ? { scheduledAt: when } : {}),
        },
      }).unwrap();
    }
    const reviewerIds = draft.approvers.map((a) => Number(a.id));
    const oldReviewers = (p.approvalRequest?.reviewerUser ?? []).map((r) => Number(r.id));
    if (reviewerIds.slice().sort().join(",") !== oldReviewers.slice().sort().join(",")) await setReviewers({ postId: p.id, approverUserIds: reviewerIds }).unwrap();

    const first = scheduled ? firstTime(draft) : null;
    const changes: IUpdatePostDTO = {
      title: draft.title.trim(),
      ...(sharedText(draft) ? { text: draft.text } : {}),
      labelIds: draft.labelIds,
      campaignIds: draft.campaignIds,
      ...(first ? { scheduledAt: first } : {}),
    };
    if (draft.mode === "DRAFT" && p.status !== "DRAFT") changes.status = "DRAFT";
    if (scheduled) changes.status = reviewerIds.length && p.approvalStatus !== "APPROVED" ? "PENDING_APPROVAL" : "SCHEDULED";
    await updatePost({ postId: p.id, post: changes }).unwrap();
    if (draft.mode === "PUBLISH_NOW") await publishNow(p.id).unwrap();
    return p.id;
  };

  const submit = async () => {
    const bad = STEPS.find(hasProblems);
    if (bad) {
      setShown(Object.fromEntries(STEPS.map((s) => [s, true])));
      go(bad);
      focusFirstError();
      return;
    }
    setBusy(true);
    try {
      const id = post ? await saveExisting(post) : await saveNew();
      saved.current = true;
      initial.current = JSON.stringify(draft);
      router.replace(id ? `/posts/${id}` : "/posts");
    } catch {
      // The request's toast says what went wrong; the draft stays as it is.
      setBusy(false);
    }
  };

  const submitLabel = draft.approvers.length
    ? draft.mode === "DRAFT"
      ? t("submitDraft")
      : t("submitApproval")
    : draft.mode === "PUBLISH_NOW"
      ? t("submitNow")
      : draft.mode === "SCHEDULED"
        ? t("submitSchedule")
        : t("submitDraft");
  const last = index === STEPS.length - 1;

  return (
    <section className="flex flex-col gap-6" data-composer>
      <PageHeader
        title={post ? t("editTitle") : t("newTitle")}
        description={post ? <span dir="auto">{post.title}</span> : t("newDescription")}
        breadcrumb={[{ label: t("crumbPosts"), href: `/${locale}/posts` }, ...(post ? [{ label: <span dir="auto">{post.title}</span>, href: `/${locale}/posts/${post.id}` }] : []), { label: post ? t("editTitle") : t("newTitle") }]}
      />
      <Stepper steps={steps} label={t("stepsLabel")} lockedHint={t("lockedHint")} onStepClick={(id) => STEPS.indexOf(id as StepId) <= reached && go(id as StepId)} />
      <Card padding="lg" className="flex flex-col gap-6">
        <h2 className="font-display text-title text-fg">{labels[step]}</h2>
        {step === "content" ? (
          <ContentStep
            draft={draft}
            update={update}
            problems={problems.content}
            show={Boolean(shown.content)}
            platforms={platforms}
            platformsStatus={platformsQuery.isLoading ? "loading" : platformsQuery.isError ? "error" : "ready"}
            onRetryPlatforms={() => platformsQuery.refetch()}
            msg={msg}
          />
        ) : step === "media" ? (
          <MediaStep draft={draft} update={update} problems={problems.media} show={Boolean(shown.media)} limits={limits} msg={msg} />
        ) : (
          <ScheduleStep draft={draft} update={update} problems={problems.schedule} show={Boolean(shown.schedule)} timeZone={timeZone} editing={editing} msg={msg} />
        )}
        {step === "schedule" && shown.schedule && problems.schedule.mode ? (
          <p role="alert" className="text-body-sm text-danger">
            {msg(problems.schedule.mode)}
          </p>
        ) : null}
      </Card>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" onClick={cancel} disabled={busy}>
          {t("cancel")}
        </Button>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          {index > 0 ? (
            <Button variant="secondary" startIcon={<ArrowLeft className="rtl:-scale-x-100" />} onClick={() => go(STEPS[index - 1])} disabled={busy}>
              {t("back")}
            </Button>
          ) : null}
          {last ? (
            <Button variant="primary" onClick={submit} loading={busy}>
              {post ? (draft.mode === "PUBLISH_NOW" ? t("saveAndPublish") : t("saveChanges")) : submitLabel}
            </Button>
          ) : (
            <Button variant="primary" endIcon={<ArrowRight className="rtl:-scale-x-100" />} onClick={next}>
              {t("next", { step: labels[STEPS[index + 1]] })}
            </Button>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={leaveTo !== null}
        onOpenChange={(open) => !open && setLeaveTo(null)}
        title={post ? t("discardEditTitle") : t("discardTitle")}
        impact={post ? t("discardEditImpact") : t("discardImpact")}
        confirmLabel={t("discardConfirm")}
        cancelLabel={t("keepEditing")}
        onConfirm={() => leave(leaveTo ?? home)}
      />
    </section>
  );
}
