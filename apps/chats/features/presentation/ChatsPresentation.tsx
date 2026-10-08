"use client";
import { demoRuntime } from "@orgtik/ui";

import { useEffect, useState } from "react";
import { ChatsCircle, Hash, BookmarkSimple, Clock, CheckSquareOffset, Paperclip, VideoCamera, TextB, Plus, ArrowCounterClockwise, PaperPlaneTilt, Microphone, MicrophoneSlash } from "@phosphor-icons/react";
import { AppRail, Badge, Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, EmptyState, Field, Input, Sidebar, SimulatedTag, SuiteShell, Textarea, useDemoScene } from "@orgtik/ui";
import { useI18n } from "@/lib/i18n";
import { personaNames, sceneKey, seedScene, workspaceNames, type ChatScene, type DemoMessage } from "./scene";
import { demoRequest, type DemoBridgeTask } from "@orgtik/ui";

export function ChatsPresentation() {
  const { t, setLocale } = useI18n();
  return <SuiteShell demo={{ runtime: demoRuntime(process.env.NEXT_PUBLIC_DEMO_API, process.env.NEXT_PUBLIC_DEMO_WEB_URLS, process.env.NEXT_PUBLIC_DEMO_SOS_API), enabled: true, appKey: "chats", onLocaleChange: setLocale }} rail={<AppRail current="chats" homeHref="/presentation" apps={[{ id: "chats", label: t("nav.chat", "Chat"), href: "/presentation", icon: <ChatsCircle /> }]} />} sidebar={<Sidebar title={t("nav.chat", "Chat")} sections={[{ items: [{ label: t("presentation.title", "Chats walkthrough"), href: "/presentation", active: true, icon: <ChatsCircle /> }, { label: t("nav.office", "Office"), href: "/hq/office", icon: <VideoCamera /> }, { label: t("nav.boards", "Whiteboard"), href: "/hq/whiteboard", icon: <CheckSquareOffset /> }] }]} />} topBar={{ start: <span className="font-semibold">{t("presentation.title", "Chats walkthrough")}</span> }}><PresentationContent /></SuiteShell>;
}

function PresentationContent() {
  const demo = useDemoScene();
  const workspace = demo.scene.workspace === "current" ? "nile" : demo.scene.workspace;
  // Keyed children prevent a frame of the previous workspace's fixture data.
  return <WorkspaceConversation key={workspace} workspace={workspace} author={personaNames[demo.scene.persona] ?? "Nour Khaled"} />;
}

function WorkspaceConversation({ workspace, author }: { workspace: string; author: string }) {
  const bridge = useDemoScene();
  const { t } = useI18n();
  const [data, setData] = useState<ChatScene>(() => seedScene(workspace));
  const [loaded, setLoaded] = useState(false), [active, setActive] = useState("launch-review"), [filter, setFilter] = useState("all");
  const [draft, setDraft] = useState(""), [bold, setBold] = useState(false), [attachment, setAttachment] = useState("");
  const [picker, setPicker] = useState(false), [call, setCall] = useState(false), [muted, setMuted] = useState(false);
  const [creating, setCreating] = useState(false), [channelName, setChannelName] = useState("");
  const [notice, setNotice] = useState("");
  const [creatingTask, setCreatingTask] = useState<string|null>(null);
  useEffect(() => { try { const raw = sessionStorage.getItem(sceneKey(workspace)); if (raw) { const saved = JSON.parse(raw); if (Array.isArray(saved.channels) && Array.isArray(saved.messages) && Array.isArray(saved.read)) setData(saved); } } catch {} setLoaded(true); }, [workspace]);
  useEffect(() => { if (loaded) { try { sessionStorage.setItem(sceneKey(workspace), JSON.stringify(data)); } catch {} } }, [data, loaded, workspace]);
  const changeMessage = (id: string, patch: Partial<DemoMessage>) => setData(current => ({ ...current, messages: current.messages.map(message => message.id === id ? { ...message, ...patch } : message) }));
  const openChannel = (name: string) => { setActive(name); setFilter("all"); setData(current => ({ ...current, read: [...new Set([...current.read, name])] })); };
  const send = (scheduled = false) => {
    if (!draft.trim() && !attachment) return;
    setData(current => ({ ...current, messages: [...current.messages, { id: crypto.randomUUID(), channel: active, author, body: draft.trim(), bold, file: attachment || undefined, scheduled } ] }));
    setDraft(""); setAttachment(""); setBold(false);
    setNotice(scheduled ? t("presentation.scheduledNotice", "Queued for tomorrow at 09:00 in this demo. Delivery is simulated.") : t("presentation.sentNotice", "Message added to this demo conversation."));
  };
  const reset = () => { setData(seedScene(workspace)); setActive("launch-review"); setFilter("all"); setDraft(""); setAttachment(""); setNotice(t("presentation.resetNotice", "Only this presentation workspace was reset.")); };
  const messages = data.messages.filter(message => (filter === "saved" ? message.saved : filter === "scheduled" ? message.scheduled : message.channel === active && !message.scheduled));
  const files = ["partner-brief.pdf", "launch-checklist.pdf", "brand-preview.png"];
  return <div className="flex min-h-full min-w-0 flex-col bg-canvas">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 md:px-6">
      <div><h1 className="text-title-lg font-semibold"><bdi>{workspaceNames[workspace]}</bdi></h1><p className="mt-1 text-body-sm text-fg-muted">{t("presentation.identity", "Presenting as {name}", { name: author })}</p></div>
      <div className="flex items-center gap-2"><SimulatedTag /><Button size="sm" variant="secondary" startIcon={<ArrowCounterClockwise />} onClick={reset}>{t("presentation.reset", "Reset conversation")}</Button></div>
      <p className="w-full max-w-[75ch] text-body-sm text-fg-muted">{t("presentation.explainer", "An isolated design walkthrough. Messages, reminders, tasks and calls stay in this browser tab; your account and business data are untouched.")}</p>
    </header>
    <div className="grid min-w-0 flex-1 grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="border-b border-line bg-raised p-3 md:border-b-0 md:border-e">
        <nav aria-label={t("presentation.navigation", "Presentation conversations")} className="flex flex-col gap-1">
          <div className="flex items-center justify-between px-2 pb-2"><h2 className="text-body-sm font-semibold">{t("chat.channels", "Channels")}</h2><Button variant="ghost" size="sm" aria-label={t("chat.newChannel", "New channel")} onClick={() => setCreating(true)}><Plus /></Button></div>
          <div className="flex flex-wrap gap-1 md:flex-col">{data.channels.map(name => <Button key={name} variant={active === name && filter === "all" ? "secondary" : "ghost"} size="sm" className="justify-start" startIcon={<Hash />} onClick={() => openChannel(name)}><bdi className="truncate">{name}</bdi>{!data.read.includes(name) && <Badge tone="brand" size="sm">1</Badge>}</Button>)}</div>
          <div className="mt-3 flex flex-wrap gap-1 border-t border-line pt-3 md:flex-col">
            <Button size="sm" variant={filter === "saved" ? "secondary" : "ghost"} startIcon={<BookmarkSimple />} onClick={() => setFilter("saved")}>{t("presentation.saved", "Saved messages")}</Button>
            <Button size="sm" variant={filter === "scheduled" ? "secondary" : "ghost"} startIcon={<Clock />} onClick={() => setFilter("scheduled")}>{t("presentation.scheduled", "Scheduled messages")}</Button>
          </div>
        </nav>
      </aside>
      <section className="min-w-0" aria-label={t("presentation.conversation", "Conversation")}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 md:px-6"><h2 className="text-title-sm font-semibold">{filter === "saved" ? t("presentation.saved", "Saved messages") : filter === "scheduled" ? t("presentation.scheduled", "Scheduled messages") : <bdi>#{active}</bdi>}</h2><Button variant="secondary" size="sm" startIcon={<VideoCamera />} onClick={() => setCall(true)}>{t("presentation.call", "Start mock call")}</Button></div>
        <div className="min-h-[220px] px-4 md:px-6">
          {!messages.length ? <EmptyState title={t("presentation.noMessages", "No messages here yet")} description={t("presentation.emptyHint", "Send a message, save one for later, or create a channel to begin.")} /> : messages.map(message => <article key={message.id} className="border-b border-line py-5">
            <div className="flex flex-wrap items-center gap-2"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-subtle text-caption font-semibold text-fg-brand" aria-hidden="true">{message.author.split(" ").map(part => part[0]).slice(0, 2).join("")}</span><h3 className="text-body-sm font-semibold"><bdi>{message.author}</bdi></h3><span className="text-caption text-fg-muted">09:00</span>{message.scheduled && <Badge tone="info">{t("presentation.tomorrow", "Tomorrow · 09:00")}</Badge>}</div>
            <p dir="auto" className={`mt-2 max-w-[70ch] whitespace-pre-wrap break-words text-body ${message.bold ? "font-bold" : ""}`}>{message.body}</p>
            {message.file && <Button variant="secondary" size="sm" className="mt-3" startIcon={<Paperclip />} onClick={() => { setAttachment(message.file!); setPicker(true); }}><bdi>{message.file}</bdi></Button>}
            <div className="mt-3 flex flex-wrap gap-1">
              <Button size="sm" variant="ghost" startIcon={<BookmarkSimple weight={message.saved ? "fill" : "regular"} />} onClick={() => changeMessage(message.id, { saved: !message.saved })}>{message.saved ? t("presentation.unsave", "Unsave") : t("presentation.save", "Save")}</Button>
              <Button size="sm" variant="ghost" startIcon={<Clock />} disabled={Boolean(message.reminder)} onClick={() => { changeMessage(message.id, { reminder: true }); setNotice(t("presentation.reminderNotice", "Reminder set for tomorrow at 09:00. Notification delivery is simulated.")); }}>{message.reminder ? t("presentation.reminderSet", "Reminder set") : t("presentation.remind", "Remind me")}</Button>
              <Button size="sm" variant="ghost" startIcon={<CheckSquareOffset />} disabled={Boolean(message.task) || creatingTask === message.id} onClick={async () => { setCreatingTask(message.id); try { const task = bridge.runtime ? await demoRequest<DemoBridgeTask>(bridge.runtime, bridge.scene, "/tasks", { title: message.body || "Message follow-up", owner: author, sourceApp: "chats" }) : { id: `TASK-${data.messages.indexOf(message) + 101}` }; changeMessage(message.id, { task: task.id }); setNotice(t("presentation.taskNotice", "A mock task was created from this message. Backend linking is pending.")); } catch { setNotice(t("presentation.connectionError", "The presentation connection is unavailable. Try again.")); } finally { setCreatingTask(null); } }}>{message.task ? <bdi>{message.task}</bdi> : t("presentation.task", "Create task")}</Button>
              {message.scheduled && <><Button size="sm" variant="secondary" onClick={() => changeMessage(message.id, { scheduled: false })}>{t("presentation.sendNow", "Send now")}</Button><Button size="sm" variant="ghost" onClick={() => setData(current => ({ ...current, messages: current.messages.filter(item => item.id !== message.id) }))}>{t("presentation.cancel", "Cancel")}</Button></>}
            </div>
          </article>)}
        </div>
        {notice && <p role="status" className="mx-4 my-3 border border-line bg-raised px-3 py-2 text-body-sm md:mx-6">{notice}</p>}
        {filter === "all" && data.channels.includes(active) && <form className="m-4 border border-line bg-raised p-3 md:m-6" onSubmit={event => { event.preventDefault(); send(); }}>
          <Field label={t("presentation.compose", "Message #{channel}", { channel: active })}><Textarea value={draft} rows={3} onChange={event => setDraft(event.target.value)} placeholder={t("presentation.placeholder", "Share an update with your team…")} className={bold ? "font-bold" : ""} /></Field>
          {attachment && <div className="mt-2 flex flex-wrap items-center gap-2"><Paperclip /><bdi className="text-body-sm">{attachment}</bdi><Button variant="ghost" size="sm" onClick={() => setAttachment("")}>{t("presentation.remove", "Remove")}</Button></div>}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><div className="flex gap-1"><Button variant={bold ? "secondary" : "ghost"} size="sm" aria-pressed={bold} aria-label={t("presentation.bold", "Bold message")} onClick={() => setBold(value => !value)}><TextB /></Button><Button variant="ghost" size="sm" startIcon={<Paperclip />} onClick={() => setPicker(true)}>{t("presentation.attach", "Attach file")}</Button></div><div className="flex flex-wrap gap-2"><Button variant="secondary" size="sm" disabled={!draft.trim() && !attachment} startIcon={<Clock />} onClick={() => send(true)}>{t("presentation.schedule", "Schedule tomorrow")}</Button><Button type="submit" size="sm" disabled={!draft.trim() && !attachment} startIcon={<PaperPlaneTilt />}>{t("presentation.send", "Send")}</Button></div></div>
        </form>}
      </section>
    </div>
    <Dialog open={creating} onOpenChange={setCreating}><DialogContent size="sm"><DialogHeader><DialogTitle>{t("chat.newChannel", "New channel")}</DialogTitle><DialogDescription>{t("presentation.channelHint", "Create a channel in this presentation workspace.")}</DialogDescription></DialogHeader><DialogBody><Field label={t("presentation.channelName", "Channel name")}><Input value={channelName} maxLength={48} onChange={event => setChannelName(event.target.value)} /></Field></DialogBody><DialogFooter><Button variant="secondary" onClick={() => setCreating(false)}>{t("presentation.cancel", "Cancel")}</Button><Button disabled={!channelName.trim() || data.channels.includes(channelName.trim())} onClick={() => { const name = channelName.trim(); setData(current => ({ ...current, channels: [...current.channels, name], read: [...current.read, name] })); setActive(name); setFilter("all"); setChannelName(""); setCreating(false); }}>{t("presentation.create", "Create channel")}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={picker} onOpenChange={setPicker}><DialogContent size="sm"><DialogHeader><DialogTitle>{t("presentation.files", "Files in this workspace")}</DialogTitle><DialogDescription>{t("presentation.fileHint", "Packaged sample references for this demo. Binary uploads and live file authorization are outside this walkthrough.")}</DialogDescription></DialogHeader><DialogBody><SimulatedTag /><div className="mt-3 flex flex-col gap-2">{files.map(file => <Button key={file} variant="secondary" className="justify-start" startIcon={<Paperclip />} onClick={() => { setAttachment(file); setPicker(false); }}><bdi>{file}</bdi></Button>)}</div></DialogBody></DialogContent></Dialog>
    <Dialog open={call} onOpenChange={setCall}><DialogContent size="md"><DialogHeader><DialogTitle>{t("presentation.callTitle", "Design review call")}</DialogTitle><DialogDescription>{t("presentation.callHint", "A simulated call stage. No microphone, camera, recording or external media connection is active.")}</DialogDescription></DialogHeader><DialogBody><SimulatedTag /><div className="mt-4 grid grid-cols-2 gap-3">{[author, "Mona Adel"].map((name, index) => <div key={index} className="grid min-h-40 place-items-center rounded-panel border border-line bg-canvas p-4"><span className="grid size-14 place-items-center rounded-full bg-brand-subtle text-title-sm font-semibold text-fg-brand">{name.split(" ").map(part => part[0]).slice(0, 2).join("")}</span><bdi className="text-body-sm">{name}</bdi></div>)}</div></DialogBody><DialogFooter><Button variant="secondary" startIcon={muted ? <MicrophoneSlash /> : <Microphone />} aria-pressed={muted} onClick={() => setMuted(value => !value)}>{muted ? t("presentation.unmute", "Unmute mock microphone") : t("presentation.mute", "Mute mock microphone")}</Button><Button onClick={() => setCall(false)}>{t("presentation.endCall", "End mock call")}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
