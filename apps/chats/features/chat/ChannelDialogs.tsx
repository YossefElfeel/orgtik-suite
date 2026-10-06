"use client";

/**
 * SOMION HQ - CHANNEL LIFECYCLE
 *
 * The screens the chat core needs to stop being read-only: creating a channel,
 * seeing who is in one, adding people, changing what it is for, muting it and
 * leaving it.
 *
 * Create is a modal because it is a decision you finish before carrying on.
 * Details is a side pane because it is reference you read while the
 * conversation stays visible - putting it in a modal would hide the thing it
 * describes.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Hash, Lock, MagnifyingGlass, PushPin, SignOut, FileText, Check } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, Chip, EmptyState, Field } from "@/components/ui/Primitives";
import { ConfirmModal, Modal } from "@/components/ui/Overlays";
import { FilePreview } from "./FilePreview";
import { useCan, useChannel, usePinned, usePresenceOf, useUsers, useMessages } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { useT } from "@/lib/i18n";
import { formatRelative } from "@/lib/time";

/* ------------------------------------------------------------ create -----*/

export function CreateChannelModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createChannel = useWorkspace((s) => s.createChannel);
  const users = useUsers();
  const me = useWorkspace((s) => s.me);
  const router = useRouter();
  const t = useT();

  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setTopic("");
    setIsPrivate(false);
    setPicked([]);
    setError(null);
  };

  const submit = () => {
    if (name.trim().length < 2) {
      setError(t("channel.nameRequired", "Give the channel a name so people know what belongs in it."));
      return;
    }
    const id = createChannel({ name, topic, isPrivate, memberIds: picked });
    reset();
    onClose();
    router.push(`/hq/chat/${id}`);
  };

  /* The slug is shown as it will actually appear, so nobody is surprised. */
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={t("channel.createTitle", "New channel")}
      description={t(
        "channel.createDesc",
        "Channels are for a subject the whole team can follow. For one conversation about one record, use Discuss on the record instead.",
      )}
      footer={
        <>
          <Button
            size="sm"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button variant="primary" size="sm" onClick={submit}>
            {t("channel.create", "Create channel")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field
          label={t("channel.nameLabel", "Name")}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          placeholder={t("channel.namePlaceholder", "product-launch")}
          {...(error ? { error } : {})}
          {...(slug && slug !== name.trim().toLowerCase()
            ? { hint: t("channel.willBe", "Will appear as #{slug}", { slug }) }
            : {})}
        />

        <Field
          label={t("channel.topicLabel", "What is it for?")}
          hint={t("channel.topicHint", "Shown at the top of the channel and in search results")}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={t("channel.topicPlaceholder", "Everything about the autumn launch")}
        />

        <fieldset className="flex flex-col gap-1.5">
          <legend className="pb-1.5 text-[12.5px] font-medium" style={{ color: "var(--color-ink)" }}>
            {t("channel.visibility", "Who can find it")}
          </legend>
          {[
            {
              value: false,
              icon: <Hash size={14} weight="bold" aria-hidden="true" />,
              label: t("channel.public", "Public"),
              desc: t("channel.publicDesc", "Anyone in the workspace can find and join it."),
            },
            {
              value: true,
              icon: <Lock size={14} weight="bold" aria-hidden="true" />,
              label: t("channel.private", "Private"),
              desc: t("channel.privateDesc", "Only invited people can find it, including in search."),
            },
          ].map((opt) => (
            <label
              key={String(opt.value)}
              className="hq-row flex cursor-pointer items-start gap-2.5 px-3 py-2.5"
              style={{
                border: `1px solid ${isPrivate === opt.value ? "var(--color-accent)" : "var(--color-hairline-strong)"}`,
                borderRadius: "var(--radius-control)",
                background: isPrivate === opt.value ? "var(--color-accent-soft)" : "var(--color-surface)",
              }}
            >
              <input
                type="radio"
                name="visibility"
                checked={isPrivate === opt.value}
                onChange={() => setIsPrivate(opt.value)}
                className="mt-0.5"
                style={{ accentColor: "var(--color-accent)" }}
              />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: "var(--color-ink)" }}>
                  {opt.icon}
                  {opt.label}
                </span>
                <span className="mt-0.5 block text-[12px]" style={{ color: "var(--color-ink-muted)" }}>
                  {opt.desc}
                </span>
              </span>
            </label>
          ))}
        </fieldset>

        <PeoplePicker
          label={t("channel.addPeopleLabel", "Add people")}
          hint={t("channel.addPeopleHint", "You can add more later")}
          exclude={[me]}
          picked={picked}
          onToggle={(id) =>
            setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
          }
          users={users}
        />
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------ people picker ----*/

export function PeoplePicker({
  label,
  hint,
  users,
  exclude,
  picked,
  onToggle,
}: {
  label: string;
  hint?: string;
  users: { id: string; name: string; initials: string; tint: number; title: string }[];
  exclude: string[];
  picked: string[];
  onToggle: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const t = useT();

  const list = useMemo(
    () =>
      users
        .filter((u) => !exclude.includes(u.id))
        .filter((u) => u.name.toLowerCase().includes(query.toLowerCase())),
    [users, exclude, query],
  );

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-medium" style={{ color: "var(--color-ink)" }}>
        {label}
      </span>
      {hint && (
        <span className="text-[12px]" style={{ color: "var(--color-ink-muted)" }}>
          {hint}
        </span>
      )}

      <div className="relative">
        <MagnifyingGlass
          size={14}
          aria-hidden="true"
          className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2"
          style={{ color: "var(--color-ink-subtle)" }}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("channel.searchPeople", "Search people")}
          aria-label={t("channel.searchPeople", "Search people")}
          className="w-full"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-hairline-strong)",
            borderRadius: "var(--radius-control)",
            padding: "7px 10px 7px 29px",
            fontSize: "13px",
            minHeight: 34,
          }}
        />
      </div>

      <ul
        className="mt-1 max-h-[184px] overflow-y-auto"
        style={{ border: "1px solid var(--color-hairline)", borderRadius: "var(--radius-control)" }}
      >
        {list.length === 0 && (
          <li className="px-3 py-3 text-[12.5px]" style={{ color: "var(--color-ink-muted)" }}>
            {t("channel.noPeople", "Nobody matches “{q}”.", { q: query })}
          </li>
        )}
        {list.map((u) => {
          const on = picked.includes(u.id);
          return (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => onToggle(u.id)}
                aria-pressed={on}
                className="hq-row flex w-full items-center gap-2.5 px-2.5 text-start"
                style={{ minHeight: 40 }}
              >
                <Avatar name={u.name} initials={u.initials} tint={u.tint} size={28} hideStatus />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px]" style={{ color: "var(--color-ink)" }}>
                    <bdi>{u.name}</bdi>
                  </span>
                  <span className="block truncate text-[11.5px]" style={{ color: "var(--color-ink-muted)" }}>
                    <bdi>{u.title}</bdi>
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="flex shrink-0 items-center justify-center"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    border: `1px solid ${on ? "var(--color-accent)" : "var(--color-hairline-strong)"}`,
                    background: on ? "var(--color-accent)" : "var(--color-surface)",
                    color: "var(--color-ink-inverse)",
                  }}
                >
                  {on && <Check size={11} weight="bold" />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {picked.length > 0 && (
        <span className="tabular text-[12px]" style={{ color: "var(--color-ink-muted)" }}>
          {t("channel.pickedCount", "{n} selected", { n: picked.length })}
        </span>
      )}
    </div>
  );
}

/* ----------------------------------------------------------- details -----*/

type Tab = "about" | "members" | "files" | "pinned";

export function ChannelDetailsPane({
  channelId,
  onClose,
}: {
  channelId: string;
  onClose: () => void;
}) {
  const channel = useChannel(channelId);
  const users = useUsers();
  const messages = useMessages(channelId);
  const pinned = usePinned(channelId);
  const updateChannel = useWorkspace((s) => s.updateChannel);
  const addMembers = useWorkspace((s) => s.addChannelMembers);
  const leaveChannel = useWorkspace((s) => s.leaveChannel);
  const removeMember = useWorkspace((s) => s.removeChannelMember);
  const me = useWorkspace((s) => s.me);
  const can = useCan();
  const router = useRouter();
  const t = useT();
  const [newName, setNewName] = useState(channel?.name ?? "");
  const [confirmArchive, setConfirmArchive] = useState(false);

  const [tab, setTab] = useState<Tab>("about");
  const [adding, setAdding] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [topic, setTopic] = useState(channel?.topic ?? "");
  const [preview, setPreview] = useState<import("@/entities").FileRef | null>(null);

  if (!channel) return null;

  const isDm = channel.kind === "dm" || channel.kind === "group";
  const members = channel.memberIds
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is NonNullable<typeof u> => Boolean(u));
  const files = messages.flatMap((m) => m.attachments.map((f) => ({ file: f, message: m })));

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: "about", label: t("channel.about", "About") },
    { id: "members", label: t("channel.members", "Members"), count: members.length },
    { id: "files", label: t("channel.files", "Files"), count: files.length },
    { id: "pinned", label: t("channel.pinned", "Pinned"), count: pinned.length },
  ];

  return (
    <aside
      aria-label={t("channel.detailsFor", "Details for {name}", {
        name: isDm ? channel.name : `#${channel.name}`,
      })}
      className="flex min-h-0 w-full flex-col"
      style={{ background: "var(--color-surface)" }}
    >
      <header className="shrink-0 px-4 pt-3" style={{ borderBottom: "1px solid var(--color-hairline)" }}>
        <div className="flex items-start justify-between gap-2">
          <h2 className="hq-title" style={{ color: "var(--color-ink)" }}>
            {isDm ? channel.name : `#${channel.name}`}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t("common.close", "Close")}
          </Button>
        </div>

        <div className="mt-2 flex gap-1 overflow-x-auto" role="tablist">
          {TABS.map((x) => (
            <button
              key={x.id}
              role="tab"
              aria-selected={tab === x.id}
              onClick={() => setTab(x.id)}
              className="hq-btn whitespace-nowrap px-2.5 pb-2 pt-1 text-[12.5px] font-medium"
              style={{
                color: tab === x.id ? "var(--color-ink-brand)" : "var(--color-ink-muted)",
                borderBottom: `2px solid ${tab === x.id ? "var(--color-accent)" : "transparent"}`,
                borderRadius: 0,
              }}
            >
              {x.label}
              {x.count !== undefined && (
                <span className="tabular ms-1.5" style={{ opacity: 0.65 }}>
                  {x.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "about" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ch-topic" className="text-[12.5px] font-medium" style={{ color: "var(--color-ink)" }}>
                {t("channel.topicLabel", "What is it for?")}
              </label>
              <textarea
                id="ch-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onBlur={() => updateChannel(channelId, { topic: topic.trim() })}
                rows={2}
                placeholder={t("channel.topicPlaceholder", "Everything about the autumn launch")}
                className="w-full resize-none"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-hairline-strong)",
                  borderRadius: "var(--radius-control)",
                  padding: "8px 11px",
                  fontSize: "13px",
                }}
              />
              <span className="text-[11.5px]" style={{ color: "var(--color-ink-subtle)" }}>
                {t("channel.savesOnBlur", "Saved when you click away.")}
              </span>
            </div>

            {!isDm && can.archiveChannels && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ch-name" className="text-[12.5px] font-medium" style={{ color: "var(--color-ink)" }}>
                  {t("channel.rename", "Name")}
                </label>
                <div className="flex gap-2">
                  <input
                    id="ch-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="min-w-0 flex-1"
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-hairline-strong)",
                      borderRadius: "var(--radius-control)",
                      padding: "7px 10px",
                      fontSize: "13px",
                      minHeight: 34,
                    }}
                  />
                  <Button
                    size="sm"
                    disabled={!newName.trim() || newName.trim() === channel.name}
                    onClick={() =>
                      updateChannel(channelId, {
                        name: newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
                      })
                    }
                  >
                    {t("channel.renameAction", "Rename")}
                  </Button>
                </div>
                <span className="text-[11.5px]" style={{ color: "var(--color-ink-subtle)" }}>
                  {t("channel.renameHint", "Links to the channel keep working; only the name changes.")}
                </span>
              </div>
            )}

            {!isDm && can.archiveChannels && (
              <div
                className="flex items-start justify-between gap-3 px-3 py-2.5"
                style={{ border: "1px solid var(--color-hairline-strong)", borderRadius: "var(--radius-control)" }}
              >
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium" style={{ color: "var(--color-ink)" }}>
                    {channel.archived ? t("channel.archived", "Archived") : t("channel.archive", "Archive this channel")}
                  </span>
                  <span className="mt-0.5 block text-[12px]" style={{ color: "var(--color-ink-muted)" }}>
                    {channel.archived
                      ? t("channel.archivedHint", "Read-only and out of the list, but still searchable.")
                      : t("channel.archiveHint", "Nobody can post; the history stays searchable. You can bring it back.")}
                  </span>
                </span>
                {channel.archived ? (
                  <Button size="sm" onClick={() => updateChannel(channelId, { archived: false })}>
                    {t("channel.unarchive", "Unarchive")}
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setConfirmArchive(true)}>
                    {t("channel.archiveAction", "Archive")}
                  </Button>
                )}
              </div>
            )}

            <fieldset>
              <legend className="mb-1.5 text-[12.5px] font-medium" style={{ color: "var(--color-ink)" }}>
                {t("channel.notifications", "Notify me about")}
              </legend>
              <div className="flex flex-col gap-1.5">
                {(
                  [
                    {
                      value: "all" as const,
                      label: t("channel.notifyAll", "Every message"),
                      desc: t("channel.notifyAllHint", "For the one or two channels you genuinely need to follow live."),
                    },
                    {
                      value: "mentions" as const,
                      label: t("channel.notifyMentions", "Only when I am mentioned"),
                      desc: t("channel.notifyMentionsHint", "The default. Unread still shows, it just does not interrupt."),
                    },
                    {
                      value: "none" as const,
                      label: t("channel.notifyNone", "Nothing"),
                      desc: t("channel.notifyNoneHint", "Silent, and dimmed in the sidebar so you remember you set it."),
                    },
                  ]
                ).map((opt) => {
                  const on = channel.notify === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className="hq-row flex cursor-pointer items-start gap-2.5 px-3 py-2.5"
                      style={{
                        border: `1px solid ${on ? "var(--color-accent)" : "var(--color-hairline-strong)"}`,
                        borderRadius: "var(--radius-control)",
                        background: on ? "var(--color-accent-soft)" : "var(--color-surface)",
                      }}
                    >
                      <input
                        type="radio"
                        name="notify"
                        checked={on}
                        onChange={() => updateChannel(channelId, { notify: opt.value })}
                        className="mt-0.5"
                        style={{ accentColor: "var(--color-accent)" }}
                      />
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium" style={{ color: "var(--color-ink)" }}>
                          {opt.label}
                        </span>
                        <span className="mt-0.5 block text-[12px]" style={{ color: "var(--color-ink-muted)" }}>
                          {opt.desc}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {!isDm && (
              <div className="pt-1">
                <Button size="sm" variant="ghost" onClick={() => setConfirmLeave(true)} style={{ color: "var(--color-danger-600)" }}>
                  <SignOut size={13} weight="bold" aria-hidden="true" />
                  {t("channel.leave", "Leave channel")}
                </Button>
              </div>
            )}
          </div>
        )}

        {tab === "members" && (
          <div className="flex flex-col gap-3">
            {!isDm && (
              <Button size="sm" onClick={() => setAdding(true)}>
                {t("channel.addPeople", "Add people")}
              </Button>
            )}
            <ul className="flex flex-col">
              {members.map((u) => (
                <MemberRow
                  key={u.id}
                  userId={u.id}
                  name={u.name}
                  initials={u.initials}
                  tint={u.tint}
                  title={u.title}
                  {...(can.moderate && u.id !== me && !isDm
                    ? { onRemove: () => removeMember(channelId, u.id) }
                    : {})}
                />
              ))}
            </ul>
          </div>
        )}

        {tab === "files" &&
          (files.length === 0 ? (
            <EmptyState
              icon={<FileText size={20} aria-hidden="true" />}
              title={t("channel.noFiles", "No files here yet")}
              body={t("channel.noFilesBody", "Anything attached in this channel appears here, and in Files.")}
            />
          ) : (
            <ul className="flex flex-col gap-1.5">
              {files.map(({ file }) => (
                <li key={file.id}>
                  <button
                    type="button"
                    onClick={() => setPreview(file)}
                    className="hq-row flex w-full items-center gap-2.5 px-3 py-2.5 text-start"
                    style={{
                      border: "1px solid var(--color-hairline)",
                      borderRadius: "var(--radius-control)",
                      minHeight: 44,
                    }}
                  >
                    <FileText size={15} aria-hidden="true" style={{ color: "var(--color-ink-muted)" }} />
                    <span className="min-w-0 flex-1 truncate text-[12.5px]" style={{ color: "var(--color-ink)" }}>
                      <bdi>{file.name}</bdi>
                    </span>
                    <span className="tabular shrink-0 text-[11.5px]" style={{ color: "var(--color-ink-subtle)" }}>
                      {file.size}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ))}

        {tab === "pinned" &&
          (pinned.length === 0 ? (
            <EmptyState
              icon={<PushPin size={20} aria-hidden="true" />}
              title={t("channel.noPins", "Nothing pinned")}
              body={t("channel.noPinsBody", "Pin a decision so it is still findable a month later.")}
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {pinned.map((m) => {
                const author = users.find((u) => u.id === m.authorId);
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/hq/chat/${m.channelId}#${m.id}`)}
                      className="hq-row flex w-full flex-col gap-1.5 px-3 py-2.5 text-start"
                      style={{ border: "1px solid var(--color-hairline)", borderRadius: "var(--radius-control)" }}
                    >
                      <span className="flex items-center gap-2">
                        {author && (
                          <Avatar name={author.name} initials={author.initials} tint={author.tint} size={20} hideStatus />
                        )}
                        <span className="text-[12px] font-medium" style={{ color: "var(--color-ink)" }}>
                          <bdi>{author?.name}</bdi>
                        </span>
                        <span className="tabular ms-auto text-[11.5px]" style={{ color: "var(--color-ink-subtle)" }}>
                          {formatRelative(m.createdAt)}
                        </span>
                      </span>
                      <p className="text-[12.5px] leading-snug" style={{ color: "var(--color-ink)" }}>
                        <bdi>{m.text}</bdi>
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          ))}
      </div>

      <FilePreview
        file={preview}
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        context={isDm ? channel.name : `#${channel.name}`}
      />

      <Modal
        open={adding}
        onClose={() => {
          setAdding(false);
          setPicked([]);
        }}
        title={t("channel.addPeople", "Add people")}
        description={t("channel.addPeopleDesc", "They will see the full history of this channel.")}
        footer={
          <>
            <Button
              size="sm"
              onClick={() => {
                setAdding(false);
                setPicked([]);
              }}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={picked.length === 0}
              onClick={() => {
                addMembers(channelId, picked);
                setPicked([]);
                setAdding(false);
              }}
            >
              {t("channel.addN", "Add {n}", { n: picked.length })}
            </Button>
          </>
        }
      >
        <PeoplePicker
          label={t("channel.whoToAdd", "Who should join?")}
          users={users}
          exclude={channel.memberIds}
          picked={picked}
          onToggle={(id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
        />
      </Modal>

      <ConfirmModal
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        onConfirm={() => updateChannel(channelId, { archived: true })}
        title={t("channel.archiveTitle", "Archive #{name}?", { name: channel.name })}
        body={t(
          "channel.archiveBody",
          "It leaves everyone's sidebar and nobody can post in it. The history stays searchable, and an admin can bring it back.",
        )}
        confirmLabel={t("channel.archiveAction", "Archive")}
      />

      <ConfirmModal
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        onConfirm={() => {
          leaveChannel(channelId);
          onClose();
          router.push("/hq/chat/catch-up");
        }}
        title={t("channel.leaveTitle", "Leave #{name}?", { name: channel.name })}
        body={t(
          "channel.leaveBody",
          "You will stop receiving messages from it. It stays searchable, and you can rejoin at any time because it is a public channel.",
        )}
        confirmLabel={t("channel.leave", "Leave channel")}
      />
    </aside>
  );
}

function MemberRow({
  userId,
  name,
  initials,
  tint,
  title,
  onRemove,
}: {
  userId: string;
  name: string;
  initials: string;
  tint: number;
  title: string;
  /** Present only for those who may remove people. */
  onRemove?: () => void;
}) {
  const presence = usePresenceOf(userId);
  const me = useWorkspace((s) => s.me);
  const t = useT();
  return (
    <li className="flex items-center gap-2.5 py-1.5">
      <Avatar name={name} initials={initials} tint={tint} status={presence?.status} size={28} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px]" style={{ color: "var(--color-ink)" }}>
          {name}
          {userId === me && (
            <span className="ms-1.5 text-[11.5px]" style={{ color: "var(--color-ink-subtle)" }}>
              {t("office.you", "you")}
            </span>
          )}
        </span>
        <span className="block truncate text-[11.5px]" style={{ color: "var(--color-ink-muted)" }}>
          {title}
        </span>
      </span>
      {presence?.status === "available" && <Chip tone="success">{t("status.available", "Available")}</Chip>}
      {onRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          aria-label={t("channel.removeMember", "Remove {name} from this channel", { name })}
          style={{ color: "var(--color-ink-subtle)" }}
        >
          {t("channel.remove", "Remove")}
        </Button>
      )}
    </li>
  );
}

/* ------------------------------------------------------------ new message */

export function NewMessageModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const users = useUsers();
  const me = useWorkspace((s) => s.me);
  const openDm = useWorkspace((s) => s.openOrCreateDm);
  const createGroup = useWorkspace((s) => s.createGroupDm);
  const router = useRouter();
  const t = useT();
  const [picked, setPicked] = useState<string[]>([]);
  const [name, setName] = useState("");

  const reset = () => {
    setPicked([]);
    setName("");
  };

  const start = () => {
    const first = picked[0];
    if (!first) return;
    const id = picked.length === 1 ? openDm(first) : createGroup(picked, name);
    reset();
    onClose();
    router.push(`/hq/chat/${id}`);
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={t("chat.newMessageTitle", "New message")}
      description={t("chat.newMessageDesc", "One person opens a direct conversation. Two or more start a group.")}
      footer={
        <>
          <Button
            size="sm"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button variant="primary" size="sm" disabled={picked.length === 0} onClick={start}>
            {picked.length > 1 ? t("chat.startGroup", "Start group") : t("chat.startConversation", "Start conversation")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <PeoplePicker
          label={t("chat.to", "To")}
          users={users}
          exclude={[me]}
          picked={picked}
          onToggle={(id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
        />
        {picked.length > 1 && (
          <Field
            label={t("chat.groupName", "Group name")}
            hint={t("chat.groupNameHint", "Optional. Without one, the group is named after its people.")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("chat.groupNamePlaceholder", "Launch crew")}
          />
        )}
      </div>
    </Modal>
  );
}
