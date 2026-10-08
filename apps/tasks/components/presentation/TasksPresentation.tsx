"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowCounterClockwise, Bell, DownloadSimple, MagnifyingGlass, Plus, Repeat, UploadSimple } from "@phosphor-icons/react";
import { Badge, Button, Checkbox, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, EmptyState, Field, Input, MultiSelect, PageHeader, Select, SimulatedTag, Stepper, Textarea, useDemoScene, useFormatter } from "@orgtik/ui";
import { newPresentationTask, nextPresentationDue, parsePresentationCsv, PRESENTATION_PEOPLE, presentationCsv, seedPresentationTasks, type PresentationTask } from "@/lib/presentation-tasks";
import { demoRequest, type DemoBridgeTask } from "@orgtik/ui";

const statuses = ["todo", "doing", "done"] as const;
const repeats = ["none", "weekly", "monthly"] as const;

function TaskEditor({ task, onSave, onClose }: { task: PresentationTask | null; onSave: (task: PresentationTask) => void; onClose: () => void }) {
  const t = useTranslations("TasksPresentation"), demo = useDemoScene();
  const [availableFiles, setAvailableFiles] = useState<NonNullable<PresentationTask["fileRefs"]>>([]), [filesError, setFilesError] = useState(false), [filesLoading, setFilesLoading] = useState(false);
  const loadFiles = async () => { if (!demo.runtime) return; setFilesLoading(true); setFilesError(false); try { setAvailableFiles(await demoRequest(demo.runtime, demo.scene, "/files")); } catch { setFilesError(true); } finally { setFilesLoading(false); } };
  useEffect(() => { if (task) void loadFiles(); }, [task?.id, demo.runtime, demo.scene.workspace, demo.scene.persona]);
  const [draft, setDraft] = useState(task), [invalid, setInvalid] = useState(false);
  useEffect(() => { setDraft(task); setInvalid(false); }, [task]);
  const patch = (value: Partial<PresentationTask>) => setDraft(before => before ? { ...before, ...value } : null);
  return <Dialog open={Boolean(task)} onOpenChange={open => !open && onClose()}>
    <DialogContent size="lg">
      <DialogHeader><DialogTitle>{t("details")}</DialogTitle><DialogDescription>{t("localOnly")}</DialogDescription></DialogHeader>
      <DialogBody>{draft ? <form id="presentation-task" onSubmit={event => { event.preventDefault(); if (!draft.title.trim()) { setInvalid(true); return; } onSave({ ...draft, title: draft.title.trim() }); onClose(); }} className="grid gap-4 sm:grid-cols-2">
        <Field label={t("title")} error={invalid ? t("requiredTitle") : undefined} required className="sm:col-span-2"><Input required maxLength={240} value={draft.title} onChange={event => patch({ title: event.target.value })} /></Field>
        <Field label={t("owner")}><Select value={draft.owner} onValueChange={owner => owner && patch({ owner })} options={PRESENTATION_PEOPLE.map(value => ({ value, label: value }))} /></Field>
        <Field label={t("status")}><Select value={draft.status} onValueChange={status => status && patch({ status: status as PresentationTask["status"] })} options={statuses.map(value => ({ value, label: t(value) }))} /></Field>
        <Field label={t("label")}><Input maxLength={50} value={draft.label} onChange={event => patch({ label: event.target.value })} /></Field>
        <Field label={t("due")}><Input type="date" value={draft.due} onChange={event => patch({ due: event.target.value })} /></Field>
        <Field label={t("recurrence")} description={t("recurrenceNote")}><Select value={draft.recurrence} onValueChange={recurrence => recurrence && patch({ recurrence: recurrence as PresentationTask["recurrence"] })} options={repeats.map(value => ({ value, label: t(value) }))} /></Field>
        <div className="sm:col-span-2"><Field group label={t("files")} description={t("filesNote")}><div className="flex flex-col gap-3">{filesLoading ? <p className="text-body-sm text-fg-muted">{t("loadingFiles")}</p> : filesError ? <Button variant="secondary" onClick={loadFiles}>{t("retryFiles")}</Button> : availableFiles.length ? availableFiles.map(file => <Checkbox key={file.id} label={file.name} description={t("fileVersion", { version: file.version })} checked={Boolean(draft.fileRefs?.some(ref => ref.id === file.id && ref.workspace === file.workspace))} onCheckedChange={checked => patch({ fileRefs: checked ? [...(draft.fileRefs ?? []).filter(ref => ref.id !== file.id), file] : draft.fileRefs?.filter(ref => ref.id !== file.id) })} />) : <p className="text-body-sm text-fg-muted">{t("noFiles")}</p>}</div></Field>{draft.fileRefs?.filter(ref => ref.workspace === (demo.scene.workspace === "current" ? "nile" : demo.scene.workspace)).map(ref => <p className="mt-2 text-body-sm" key={ref.id}>{ref.name} · {t("fileVersion", { version: ref.version })} {demo.runtime?.webUrls.files && availableFiles.some(file => file.id === ref.id && file.workspace === ref.workspace && file.version === ref.version) ? <a href={new URL(ref.source, demo.runtime.webUrls.files).href} target="_blank" rel="noreferrer" className="font-semibold text-fg-brand underline">{t("previewFile")}</a> : null}</p>)}</div>
        <Field label={t("watchers")}><MultiSelect aria-label={t("watchers")} value={draft.watchers} onValueChange={watchers => patch({ watchers })} options={PRESENTATION_PEOPLE.map(value => ({ value, label: value }))} placeholder={t("pickPeople")} /></Field>
        <div className="sm:col-span-2"><Checkbox checked={draft.reminder} onCheckedChange={reminder => patch({ reminder })} label={t("reminder")} description={t("reminderNote")} />{draft.reminder ? <div className="mt-3 rounded-panel border border-line bg-raised p-3"><div className="mb-2 flex items-center gap-2"><SimulatedTag /><span className="text-body-sm font-semibold">{t("reminderPreview")}</span></div><p className="text-body-sm text-fg-muted">{t("recipients")}: {[draft.owner, ...draft.watchers].filter((name, i, all) => all.indexOf(name) === i).join(", ")}</p><p className="mt-2 break-words text-body" dir="auto">{draft.title || t("requiredTitle")}</p>{draft.due ? <p className="text-caption text-fg-muted">{t("due")}: {draft.due}</p> : null}</div> : null}</div>
      </form> : null}</DialogBody>
      <DialogFooter><Button variant="secondary" onClick={onClose}>{t("cancel")}</Button><Button type="submit" form="presentation-task">{t("save")}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}

function CsvImport({ open, onClose, onImport }: { open: boolean; onClose: () => void; onImport: (tasks: PresentationTask[]) => void }) {
  const t = useTranslations("TasksPresentation");
  const [step, setStep] = useState(0), [text, setText] = useState("title,owner\nReview packaging,Nour Khaled\nSchedule launch,Omar Farouk"), [titleColumn, setTitleColumn] = useState("0"), [ownerColumn, setOwnerColumn] = useState("1"), [error, setError] = useState("");
  useEffect(() => { if (open) { setStep(0); setError(""); } }, [open]);
  const parsed = useMemo(() => { try { return parsePresentationCsv(text); } catch { return []; } }, [text]);
  const headers = parsed[0] ?? [], rows = parsed.slice(1);
  const validRows = rows.filter(row => row[Number(titleColumn)]?.trim());
  const next = () => {
    if (step === 0 && (!headers.length || !rows.length || text.length > 100000 || rows.length > 200)) { setError(t("csvError")); return; }
    if (step === 1 && (validRows.length !== rows.length || !validRows.length)) { setError(t("csvTitleError")); return; }
    setError(""); setStep(step + 1);
  };
  return <Dialog open={open} onOpenChange={value => !value && onClose()}><DialogContent size="lg">
    <DialogHeader><DialogTitle>{t("import")}</DialogTitle><DialogDescription>{t("importNote")}</DialogDescription></DialogHeader>
    <DialogBody className="flex flex-col gap-5">
      <Stepper label={t("import")} steps={["source", "mapping", "review", "result"].map((key, i) => ({ id: key, label: t(key), state: i === step ? "current" : i < step ? "complete" : "upcoming" }))} onStepClick={step < 3 ? id => { setStep(["source", "mapping", "review", "result"].indexOf(id)); setError(""); } : undefined} />
      {step === 0 ? <Field label={t("csvText")} error={error || undefined}><Textarea dir="ltr" rows={8} value={text} onChange={event => { setText(event.target.value); setError(""); }} /></Field> : null}
      {step === 1 ? <div className="grid gap-4 sm:grid-cols-2"><Field label={t("titleColumn")} error={error || undefined}><Select value={titleColumn} onValueChange={value => value && setTitleColumn(value)} options={headers.map((label, i) => ({ value: String(i), label: label || String(i + 1) }))} /></Field><Field label={t("ownerColumn")}><Select value={ownerColumn} onValueChange={value => value && setOwnerColumn(value)} options={[{ value: "none", label: t("defaultOwner") }, ...headers.map((label, i) => ({ value: String(i), label: label || String(i + 1) }))]} /></Field></div> : null}
      {step === 2 ? <div><p className="mb-3 text-body text-fg-muted">{t("rowCount", { count: validRows.length })}</p><ul className="divide-y divide-line rounded-panel border border-line">{validRows.slice(0, 8).map((row, i) => <li key={i} className="px-4 py-3 text-body" dir="auto">{row[Number(titleColumn)]}</li>)}</ul>{validRows.length > 8 ? <p className="mt-2 text-caption text-fg-muted">{t("moreRows", { count: validRows.length - 8 })}</p> : null}</div> : null}
      {step === 3 ? <EmptyState title={t("imported")} description={t("rowCount", { count: validRows.length })} /> : null}
    </DialogBody>
    <DialogFooter><Button variant="secondary" onClick={onClose}>{step === 3 ? t("close") : t("cancel")}</Button>{step < 2 ? <Button onClick={next}>{t("continue")}</Button> : step === 2 ? <Button onClick={() => { onImport(validRows.map(row => newPresentationTask(row[Number(titleColumn)], PRESENTATION_PEOPLE.includes(row[Number(ownerColumn)]) ? row[Number(ownerColumn)] : PRESENTATION_PEOPLE[0]))); setStep(3); }}>{t("importRows")}</Button> : null}</DialogFooter>
  </DialogContent></Dialog>;
}

export function TasksPresentation() {
  const t = useTranslations("TasksPresentation"), f = useFormatter(), demo = useDemoScene();
  const workspace = demo.scene.workspace === "current" ? "nile" : demo.scene.workspace;
  const [tasks, setTasks] = useState<PresentationTask[]>(() => seedPresentationTasks(workspace));
  const [query, setQuery] = useState(""), [status, setStatus] = useState("all"), [owner, setOwner] = useState("all"), [label, setLabel] = useState("all"), [selected, setSelected] = useState<string[]>([]);
  const [quick, setQuick] = useState(""), [editing, setEditing] = useState<PresentationTask | null>(null), [importOpen, setImportOpen] = useState(false), [notice, setNotice] = useState("");
  const openedBridge = useRef("");
  useEffect(() => { setTasks(seedPresentationTasks(workspace)); setSelected([]); setQuery(""); setStatus("all"); setOwner("all"); setLabel("all"); setNotice(""); }, [workspace]);
  useEffect(() => { if (!demo.runtime) return; let live = true; const load = () => demoRequest<DemoBridgeTask[]>(demo.runtime!, demo.scene, "/tasks").then(rows => { if (!live) return; const incoming: PresentationTask[] = rows.map(row => ({ id: row.id, title: row.title, owner: row.owner, status: "todo", label: row.sourceApp, due: "", recurrence: "none", watchers: [], reminder: false })); setTasks(before => [...before, ...incoming.filter(row => !before.some(task => task.id === row.id))]); const target = new URLSearchParams(window.location.search).get("item"); const match = incoming.find(row => row.id === target); if (match && openedBridge.current !== match.id) { openedBridge.current = match.id; setEditing(match); } }).catch(() => {}); void load(); const timer = setInterval(load, 4000); return () => { live = false; clearInterval(timer); }; }, [demo.runtime, workspace]);
  const personaOwner = ({ nour: "Nour Khaled", rana: "Rana Saad", omar: "Omar Farouk", salma: "Salma Nabil", mona: "Mona Adel", hoda: "Hoda Ashraf", hany: "Hany Samir" } as Record<string, string>)[demo.scene.persona] ?? PRESENTATION_PEOPLE[0];
  const visible = tasks.filter(task => (!query || `${task.title} ${task.owner} ${task.label}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())) && (status === "all" || task.status === status) && (owner === "all" || task.owner === owner) && (label === "all" || task.label === label));
  const allSelected = visible.length > 0 && visible.every(task => selected.includes(task.id));
  const update = (id: string, patch: Partial<PresentationTask>) => setTasks(before => before.map(task => task.id === id ? { ...task, ...patch } : task));
  const save = (task: PresentationTask) => {
    const previous = tasks.find(item => item.id === task.id);
    const newOccurrence = previous && previous.status !== "done" && task.status === "done" && task.recurrence !== "none";
    setTasks(before => {
      const saved = previous ? before.map(item => item.id === task.id ? task : item) : [...before, task];
      return newOccurrence ? [...saved, { ...task, id: `demo-${crypto.randomUUID()}`, status: "todo", due: nextPresentationDue(task.due, task.recurrence) }] : saved;
    });
    setNotice(t(newOccurrence ? "nextCreated" : "saved"));
  };
  const complete = (task: PresentationTask) => {
    update(task.id, { status: "done" });
    if (task.status !== "done" && task.recurrence !== "none") {
      setTasks(before => [...before, { ...task, id: `demo-${crypto.randomUUID()}`, status: "todo", due: nextPresentationDue(task.due, task.recurrence) }]);
      setNotice(t("nextCreated"));
    } else setNotice(t("saved"));
  };
  const add = (title: string) => { if (!title.trim()) return; setTasks(before => [...before, newPresentationTask(title, personaOwner)]); setQuick(""); setNotice(t("created")); };
  const exportCsv = () => {
    const blob = new Blob(["\uFEFF", presentationCsv(visible)], { type: "text/csv;charset=utf-8" }), url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url; link.download = "orgtik-demo-tasks.csv"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setNotice(t("exported"));
  };
  return <div className="flex flex-col gap-5">
    <PageHeader title={t("heading")} description={t("intro")} actions={<><Button variant="secondary" startIcon={<UploadSimple />} onClick={() => setImportOpen(true)}>{t("import")}</Button><Button variant="secondary" startIcon={<DownloadSimple />} onClick={exportCsv} disabled={!visible.length}>{t("export")}</Button></>} />
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-line bg-raised px-4 py-3"><div className="flex items-center gap-2"><SimulatedTag /><p className="text-body-sm text-fg-muted">{t("localOnly")}</p></div><Button size="sm" variant="ghost" startIcon={<ArrowCounterClockwise />} onClick={() => { setTasks(seedPresentationTasks(workspace)); setSelected([]); setNotice(t("resetDone")); }}>{t("resetData")}</Button></div>
    {notice ? <p role="status" className="text-body text-fg-brand">{notice}</p> : null}
    <div className="flex flex-wrap items-end gap-3">
      <Field label={t("search")} className="min-w-0 flex-1 basis-60"><Input startIcon={<MagnifyingGlass />} value={query} onChange={event => setQuery(event.target.value)} /></Field>
      <Field label={t("status")}><Select value={status} onValueChange={value => value && setStatus(value)} options={[{ value: "all", label: t("all") }, ...statuses.map(value => ({ value, label: t(value) }))]} /></Field>
      <Field label={t("owner")}><Select value={owner} onValueChange={value => value && setOwner(value)} options={[{ value: "all", label: t("all") }, ...PRESENTATION_PEOPLE.map(value => ({ value, label: value }))]} /></Field>
      <Field label={t("label")}><Select value={label} onValueChange={value => value && setLabel(value)} options={[{ value: "all", label: t("all") }, ...Array.from(new Set(tasks.map(task => task.label).filter(Boolean))).map(value => ({ value, label: value }))]} /></Field>
    </div>
    <form onSubmit={event => { event.preventDefault(); add(quick); }} className="flex flex-wrap items-end gap-3"><Field label={t("quickAdd")} className="min-w-0 flex-1 basis-60"><Input maxLength={240} value={quick} onChange={event => setQuick(event.target.value)} /></Field><Button type="submit" startIcon={<Plus />} disabled={!quick.trim()}>{t("add")}</Button><Button variant="secondary" onClick={() => setEditing({ ...newPresentationTask(t("templateTitle"), personaOwner), label: "people", recurrence: "weekly", watchers: [PRESENTATION_PEOPLE[1]], reminder: true })}>{t("template")}</Button></form>
    {selected.length ? <div role="region" aria-label={t("bulk")} className="flex flex-wrap items-center gap-3 rounded-panel border border-line bg-brand-subtle p-3"><p className="me-auto text-body font-semibold">{t("selected", { count: selected.length })}</p><Button size="sm" variant="secondary" onClick={() => { tasks.filter(task => selected.includes(task.id) && task.status !== "done").forEach(complete); setSelected([]); }}>{t("markDone")}</Button><Button size="sm" variant="secondary" onClick={() => { setTasks(before => before.map(task => selected.includes(task.id) ? { ...task, owner: personaOwner ?? PRESENTATION_PEOPLE[0] } : task)); setSelected([]); setNotice(t("bulkDone")); }}>{t("assignMe")}</Button><Button size="sm" variant="ghost" onClick={() => setSelected([])}>{t("clear")}</Button></div> : null}
    <section aria-label={t("heading")} className="overflow-hidden rounded-panel border border-line bg-raised">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3"><Checkbox checked={allSelected} indeterminate={!allSelected && visible.some(task => selected.includes(task.id))} disabled={!visible.length} label={t("selectAll")} onCheckedChange={checked => setSelected(before => checked ? Array.from(new Set([...before, ...visible.map(task => task.id)])) : before.filter(id => !visible.some(task => task.id === id)))} /><p className="text-caption text-fg-muted">{t("rowCount", { count: visible.length })}</p></header>
      {visible.length ? <ul className="divide-y divide-line">{visible.map(task => <li key={task.id} className="flex items-start gap-3 px-4 py-4"><Checkbox aria-label={t("selectTask", { title: task.title })} checked={selected.includes(task.id)} onCheckedChange={checked => setSelected(before => checked ? [...before, task.id] : before.filter(id => id !== task.id))} className="mt-1" /><div className="min-w-0 flex-1"><button onClick={() => setEditing(task)} dir="auto" className="block max-w-full break-words text-start text-body font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">{task.title}</button><div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-caption text-fg-muted"><span>{task.owner}</span><Badge size="sm" tone={task.status === "done" ? "success" : task.status === "doing" ? "brand" : "neutral"}>{t(task.status)}</Badge>{task.label ? <Badge size="sm">{task.label}</Badge> : null}{task.due ? <span className={task.due < "2026-10-08" && task.status !== "done" ? "font-semibold text-danger" : ""}>{f.date(new Date(`${task.due}T12:00:00Z`), { dateStyle: "medium", timeZone: "UTC" })}</span> : null}{task.recurrence !== "none" ? <span className="inline-flex items-center gap-1"><Repeat aria-hidden="true" className="size-4" />{t(task.recurrence)}</span> : null}{task.reminder ? <span className="inline-flex items-center gap-1"><Bell aria-hidden="true" className="size-4" />{t("reminderOn")}</span> : null}{task.watchers.length ? <span>{t("watcherCount", { count: task.watchers.length })}</span> : null}</div></div>{task.status !== "done" ? <Button variant="ghost" size="sm" onClick={() => complete(task)}>{t("complete")}</Button> : null}</li>)}</ul> : <EmptyState title={t("emptyTitle")} description={t("emptyBody")} action={<Button variant="secondary" onClick={() => { setQuery(""); setStatus("all"); setOwner("all"); setLabel("all"); }}>{t("clearFilters")}</Button>} />}
    </section>
    <TaskEditor task={editing} onClose={() => setEditing(null)} onSave={save} />
    <CsvImport open={importOpen} onClose={() => setImportOpen(false)} onImport={rows => { setTasks(before => [...before, ...rows]); setNotice(t("imported")); }} />
  </div>;
}
