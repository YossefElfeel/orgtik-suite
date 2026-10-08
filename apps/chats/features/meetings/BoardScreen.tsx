"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { readClientSession } from "@orgtik/ui/auth";
import { Button, Input, Select } from "@orgtik/ui";
import { FloppyDisk, Plus } from "@phosphor-icons/react";
import { useT } from "@/lib/i18n";
import { fileAuthority, fileScope, FileRequestError, recalledAttempt, rememberAttempt, useFileAuthority } from "@/lib/file-references";
import { emptyWhiteboardScene, encodeWhiteboardScene, sceneFingerprint, type WhiteboardScene } from "@/lib/whiteboard-scene";
import { boardAttempt, boardStorageKey, listWhiteboards, loadWhiteboard, saveWhiteboard, type BoardAttempt, type BoardTarget, type WhiteboardDetail, type WhiteboardSummary } from "@/lib/whiteboards";
import { Whiteboard } from "./Whiteboard";
type Draft = { scene: WhiteboardScene; name: string; baseVersionId: string | null };
function readDraft(key: string): Draft | null {
  try { const value = JSON.parse(sessionStorage.getItem(key + ":draft") || "null") as Draft | null; if (value?.scene?.schema !== "orgtik.whiteboard" || value.scene.version !== 1) return null; encodeWhiteboardScene(value.scene.elements, value.scene.appState); return value; } catch { return null; }
}
function storeDraft(key: string, value: Draft | null) { try { if (value) sessionStorage.setItem(key + ":draft", JSON.stringify(value)); else sessionStorage.removeItem(key + ":draft"); } catch { /* The open canvas remains editable. */ } }

export function BoardScreen({ boardId, versionId, meetingId, channelId, embedded = false }: { boardId?: string; versionId?: string; meetingId?: string; channelId?: string; embedded?: boolean }) {
  const t = useT(), authority = useFileAuthority();
  const query = useSearchParams();
  const requestedId = embedded ? boardId || "" : query.get("boardId") || "";
  const requestedVersion = embedded ? versionId : query.get("versionId") || undefined;
  const [selected, setSelected] = useState(boardId || ""), [pinned, setPinned] = useState(versionId), [reload, setReload] = useState(0), [editor, setEditor] = useState(0);
  const [result, setResult] = useState<{ authority: string; view?: string; items?: WhiteboardSummary[]; detail?: WhiteboardDetail | null; error?: FileRequestError }>({ authority: "" });
  const [scene, setScene] = useState<WhiteboardScene>(emptyWhiteboardScene), [name, setName] = useState(""), [baseVersion, setBaseVersion] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<BoardAttempt | null>(null), [busy, setBusy] = useState(false), [issue, setIssue] = useState<string | null>(null), [sceneIssue, setSceneIssue] = useState<string | null>(null), [conflict, setConflict] = useState(false), [recovered, setRecovered] = useState<{ boardId: string; versionId: string } | null>(null);
  const copy = useRef<(Draft & { authority: string; scope: string; target: string }) | null>(null);
  const changedScene = useCallback((next: WhiteboardScene) => setScene(current => sceneFingerprint(current) === sceneFingerprint(next) ? current : next), []);
  const [retainedDraft, setRetainedDraft] = useState<Draft | null>(null);
  const target: BoardTarget = { ...(meetingId ? { meetingId } : {}), ...(channelId ? { channelId } : {}) };
  const targetKey = JSON.stringify(target), key = boardStorageKey(target, selected || undefined);
  const selectionKey = "orgtik:whiteboard-selection:" + fileScope() + ":" + targetKey;
  const rememberSelection = (id: string, version?: string) => {
    try { sessionStorage.setItem(selectionKey, id); } catch { /* URL recovery remains available. */ }
    if (!embedded) {
      const url = new URL(window.location.href);
      if (id) url.searchParams.set("boardId", id); else url.searchParams.delete("boardId");
      if (version) url.searchParams.set("versionId", version); else url.searchParams.delete("versionId");
      window.history.replaceState(null, "", url);
    }
  };
  const view = JSON.stringify([key, pinned || "", targetKey]);
  const currentView = useRef(view); currentView.current = view;
  useEffect(() => { let saved = ""; try { if (embedded && !requestedId) saved = sessionStorage.getItem(selectionKey) || ""; } catch {} setSelected(requestedId || saved); setPinned(requestedVersion); }, [requestedId, requestedVersion, embedded, selectionKey]);
  useEffect(() => {
    const controller = new AbortController(); setResult({ authority: "" }); setBusy(false); setSceneIssue(null); setIssue(null);
    const initialize = async () => {
      const list = await listWhiteboards(target, controller.signal);
      const detail = selected ? await loadWhiteboard(selected, pinned, controller.signal) : null;
      if (controller.signal.aborted || authority !== fileAuthority()) return;
      const candidate = !pinned ? recalledAttempt(key) as BoardAttempt | null : null;
      const pending = candidate?.scope === fileScope() && ["POST", "PATCH"].includes(candidate.method) && candidate.path === "/api/hq/whiteboards" + (selected ? "/" + encodeURIComponent(selected) : "") ? candidate : null;
      if (pending) encodeWhiteboardScene(pending.body.scene.elements, pending.body.scene.appState);
      const copied = copy.current;
      const local = !pinned ? copied?.authority === authority && copied.scope === fileScope() && copied.target === targetKey ? copied : readDraft(key) : null;
      setRetainedDraft(!pinned ? readDraft(key + ":retained") : null);
      copy.current = null;
      setResult({ authority, view, items: list.items, detail });
      setAttempt(pending);
      setName(pending?.body.name || local?.name || detail?.name || "");
      setScene(pending?.body.scene || local?.scene || detail?.scene || emptyWhiteboardScene());
      setBaseVersion(pending?.body.baseVersionId || local?.baseVersionId || detail?.reference.versionId || null);
      setConflict(Boolean(local?.baseVersionId && detail && local.baseVersionId !== detail.reference.versionId && !pending));
      setEditor(value => value + 1);
    };
    void initialize().catch(error => { if (!controller.signal.aborted && authority === fileAuthority()) setResult({ authority, view, error }); });
    return () => controller.abort();
  }, [selected, pinned, targetKey, authority, reload, key, view]);
  const valid = result.authority === authority && result.view === view, detail = valid ? result.detail : undefined, items = valid ? result.items : undefined, error = valid ? result.error : undefined;
  const context = readClientSession()?.workspaceContext;
  const canCreate = Boolean(context?.tools.chat?.canWrite && context.tools.files?.canWrite && !context.actor.readOnly);
  const canWrite = detail ? detail.capabilities.canWrite && !detail.capabilities.readOnly : canCreate;
  const ready = Boolean(valid && items && !error);
  const dirty = ready && sceneFingerprint(scene) !== sceneFingerprint(detail?.scene || emptyWhiteboardScene());
  useEffect(() => {
    if (ready && !pinned && !attempt && (dirty || !detail && name)) storeDraft(key, { scene, name, baseVersionId: baseVersion });
  }, [ready, pinned, attempt, dirty, detail, name, scene, key, baseVersion]);
  const keep = (next: BoardAttempt | null) => { setAttempt(next); rememberAttempt(key, next); };
  const save = async () => {
    if (!ready || busy || !canWrite || sceneIssue || conflict || pinned || !name.trim()) return;
    const original = fileAuthority(), originalView = view, storageKey = key;
    const command = attempt || boardAttempt(scene, detail || null, name.trim(), target);
    keep(command); setBusy(true); setIssue(null);
    try {
      const saved = await saveWhiteboard(command);
      if (original !== fileAuthority() || originalView !== currentView.current) return;
      rememberAttempt(storageKey, null); storeDraft(storageKey, null); setAttempt(null);
      const newer = Boolean(saved.savedReference && saved.savedReference.versionId !== saved.reference.versionId);
      setRecovered(newer ? { boardId: saved.id, versionId: saved.savedReference!.versionId } : null);
      setScene(saved.scene); setName(saved.name); setBaseVersion(saved.reference.versionId); setConflict(false);
      setResult({ authority: original, view: originalView, items: [...(items || []).filter(item => item.id !== saved.id), saved], detail: saved });
      if (sceneFingerprint(saved.scene) !== sceneFingerprint(scene)) setEditor(value => value + 1);
      if (!selected) { rememberSelection(saved.id); setSelected(saved.id); setPinned(undefined); }
    } catch (error) {
      if (original !== fileAuthority() || originalView !== currentView.current) return;
      const failure = error instanceof FileRequestError ? error : new FileRequestError("transport_unavailable", 0, true);
      if (failure.uncertain || command.uncertain) { keep({ ...command, uncertain: true }); setIssue("uncertain"); }
      else { keep(null); setIssue(failure.status === 409 ? "conflict" : [401, 403, 404].includes(failure.status) ? "denied" : "saveFailed"); if (failure.status === 409) setConflict(true); }
    } finally { if (original === fileAuthority() && originalView === currentView.current) setBusy(false); }
  };
  const select = (id: string) => { if (attempt || busy) return; rememberSelection(id); setSelected(id); setPinned(undefined); setRecovered(null); };
  const saveAsNew = () => { if (!ready || attempt || busy || !canCreate) return; copy.current = { scene, name: name + " — " + t("boards.copyName", "copy"), baseVersionId: null, authority: fileAuthority(), scope: fileScope(), target: targetKey }; rememberSelection(""); setSelected(""); setPinned(undefined); setConflict(false); setRecovered(null); setReload(value => value + 1); };
  const reloadLatest = () => { if (attempt || busy) return; if (dirty) { const draft = { scene, name, baseVersionId: baseVersion }; storeDraft(key + ":retained", draft); setRetainedDraft(draft); } storeDraft(key, null); rememberSelection(selected); setPinned(undefined); setConflict(false); setReload(value => value + 1); };
  return <section className="flex min-h-0 flex-1 flex-col" aria-label={t("boards.title", "Whiteboard")}>
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3"><h1 className="hq-title">{t("boards.title", "Whiteboard")}</h1>
        {ready ? <Select aria-label={t("boards.choose", "Choose a board")} value={selected || "new"} onValueChange={value => select(!value || value === "new" ? "" : value)} disabled={busy || Boolean(attempt)} options={[{ value: "new", label: t("boards.newDraft", "New board") }, ...(items || []).map(item => ({ value: item.id, label: item.name }))]} /> : null}
      </div>
      {ready ? <div className="flex flex-wrap items-center gap-2">
        <span role="status" className="text-caption text-fg-muted">{busy ? t("boards.saving", "Saving…") : attempt ? t("boards.unconfirmed", "Save unconfirmed") : pinned || !canWrite ? t("boards.readOnly", "Read only") : dirty || !detail ? t("boards.unsaved", "Unsaved changes") : t("boards.committed", "Saved")}</span>
        {canCreate && !attempt ? <Button variant="secondary" size="sm" startIcon={<Plus />} onClick={() => select("")}>{t("boards.newDraft", "New board")}</Button> : null}
        {!pinned && canWrite ? <Button size="sm" startIcon={<FloppyDisk />} loading={busy} disabled={busy || !name.trim() || Boolean(sceneIssue) || conflict || Boolean(attempt && attempt.scope !== fileScope()) || !attempt && !dirty && Boolean(detail)} onClick={() => void save()}>{attempt ? t("boards.recover", "Recover save") : t("boards.save", "Save board")}</Button> : null}
      </div> : null}
    </header>
    {!ready ? <div className="grid min-h-[300px] flex-1 place-items-center p-6"><div className="max-w-md space-y-3 text-center"><p role={error ? "alert" : "status"}>{error ? error.status === 404 && meetingId ? t("boards.meetingUnavailable", "This meeting has no saved board context. Open a saved meeting where you participate.") : [401, 403, 404].includes(error.status) ? t("boards.noAccess", "This board is unavailable with your current Chats and Files access.") : t("boards.loadFailed", "Boards could not be loaded. Retry to check your saved work.") : t("boards.loading", "Loading saved boards…")}</p>{error ? <Button variant="secondary" onClick={() => setReload(value => value + 1)}>{t("boards.retry", "Retry")}</Button> : null}</div></div> : <>
      <div className="flex shrink-0 flex-col gap-2 px-4 pb-3">
        {!detail ? <Input aria-label={t("boards.name", "Board name")} placeholder={t("boards.name", "Board name")} value={name} onChange={event => setName(event.target.value)} disabled={!canWrite || busy || Boolean(attempt)} maxLength={100} /> : <h2 className="text-body-sm font-medium"><bdi>{detail.name}</bdi></h2>}
        <p className="text-caption text-fg-muted">{t("boards.vectorOnly", "Drawings and text are saved in Files. Images, imports, embeds and external links are deferred.")}</p>
        {pinned ? <p className="text-body-sm text-fg-muted">{t("boards.pinned", "You are viewing a pinned version. Editing cannot change this saved reference.")}</p> : null}
        {attempt ? <p role="alert" className="text-body-sm text-danger">{t("boards.uncertain", "Saving is unconfirmed. Recover the same scene and attempt before editing or switching boards.")}</p> : null}
        {(issue || conflict) && !attempt ? <p role="alert" className="text-body-sm text-danger">{conflict || issue === "conflict" ? t("boards.conflict", "A newer version exists. Your draft is retained; reload the latest board or save this drawing as a new board.") : issue === "denied" ? t("boards.denied", "This save was refused. Check your current Files and board access.") : t("boards.saveFailed", "The board could not be saved. Your drawing remains in this tab.")}</p> : null}
        {sceneIssue ? <p role="alert" className="text-body-sm text-danger">{sceneIssue === "scene_limit" ? t("boards.limit", "This drawing exceeds the prototype scene limit. Reduce its content before saving.") : t("boards.unsupported", "Only vector shapes and plain text can be saved. Remove imported or linked content before saving.")}</p> : null}
        {conflict || pinned ? <div className="flex flex-wrap gap-2"><Button variant="secondary" size="sm" onClick={reloadLatest}>{t("boards.reloadLatest", "Reload latest")}</Button>{canCreate ? <Button variant="secondary" size="sm" onClick={saveAsNew}>{t("boards.saveAsNew", "Save as new board")}</Button> : null}</div> : null}
        {recovered ? <div className="flex flex-wrap items-center gap-2 text-body-sm"><span>{t("boards.recoveredNewer", "Your original save was recovered. A newer board version is now open.")}</span><Button variant="secondary" size="sm" onClick={() => { rememberSelection(recovered.boardId, recovered.versionId); setSelected(recovered.boardId); setPinned(recovered.versionId); }}>{t("boards.viewRecovered", "View recovered version")}</Button></div> : null}
        {retainedDraft && !attempt ? <Button variant="secondary" size="sm" onClick={() => { setScene(retainedDraft.scene); setName(retainedDraft.name); setBaseVersion(retainedDraft.baseVersionId); setConflict(Boolean(detail && retainedDraft.baseVersionId !== detail.reference.versionId)); setEditor(value => value + 1); }}>{t("boards.restoreDraft", "Restore retained draft")}</Button> : null}
      </div>
      <div className={"min-h-0 flex-1 px-4 pb-4 " + (embedded ? "" : "min-h-[420px]")}><div className="h-full min-h-[320px] overflow-hidden rounded-card border border-line">
        <Whiteboard key={authority + ":" + selected + ":" + editor} scene={scene} readOnly={!canWrite || Boolean(attempt) || busy || Boolean(pinned)} onChange={changedScene} onIssue={setSceneIssue} />
      </div></div>
    </>}
  </section>;
}
