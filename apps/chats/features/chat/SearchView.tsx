"use client";

/**
 * SOMION HQ - SEARCH
 *
 * Messages, files and people, with filters. Search is one of the four things
 * the team said Discord does not give them, and it is consistently the most
 * under-estimated part of a chat build - so it ships in the demo rather than
 * being implied by a magnifying glass.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Hash, MagnifyingGlass, ArrowLeft } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, EmptyState } from "@/components/ui/Primitives";
import { useWorkspace } from "@/store";
import { usePresenceOf } from "@/store/hooks";
import { useT } from "@/lib/i18n";
import { Input } from "@orgtik/ui";
import { formatRelative } from "@/lib/time";
import { useTitle } from "@/lib/useTitle";

type Filter = "all" | "messages" | "files" | "people";

export function SearchView({ query }: { query: string }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const messages = useWorkspace((s) => s.messages);
  const users = useWorkspace((s) => s.users);
  const channels = useWorkspace((s) => s.channels);
  const me = useWorkspace((s) => s.me);
  const t = useT();
  useTitle(query ? t("search.titleFor", "Search: {q}", { q: query }) : t("search.title", "Search"));
  /* The page's own field: on a phone the top bar's search is hidden, so this is the way in. */
  const [draft, setDraft] = useState(query);

  const q = query.trim().toLowerCase();

  /* The four narrowings the spec names: where, who, when, and whether it
     carried a file. They scope messages and files; people are people. */
  const [inChannel, setInChannel] = useState("");
  const [fromId, setFromId] = useState("");
  const [hasFile, setHasFile] = useState(false);
  const [when, setWhen] = useState<"any" | "today" | "week" | "month">("any");

  const since = useMemo(() => {
    const d = new Date();
    if (when === "today") d.setHours(0, 0, 0, 0);
    else if (when === "week") d.setDate(d.getDate() - 7);
    else if (when === "month") d.setDate(d.getDate() - 30);
    else return 0;
    return d.getTime();
  }, [when]);

  const results = useMemo(() => {
    if (!q) return { messages: [], files: [], people: [] };
    /* Only conversations the person can open: public channels, and private ones and DMs they are in. */
    const open = new Set(channels.filter((c) => c.kind === "public" || c.memberIds.includes(me)).map((c) => c.id));
    const scoped = messages.filter(
      (m) =>
        !m.deletedAt &&
        open.has(m.channelId) &&
        (!inChannel || m.channelId === inChannel) &&
        (!fromId || m.authorId === fromId) &&
        (!hasFile || m.attachments.length > 0) &&
        (!since || new Date(m.createdAt).getTime() >= since),
    );
    return {
      messages: scoped.filter((m) => m.text.toLowerCase().includes(q)).slice(0, 25),
      files: scoped
        .flatMap((m) => m.attachments.map((f) => ({ file: f, message: m })))
        .filter(({ file }) => file.name.toLowerCase().includes(q)),
      people: users.filter(
        (u) => u.name.toLowerCase().includes(q) || u.title.toLowerCase().includes(q),
      ),
    };
  }, [q, messages, users, channels, me, inChannel, fromId, hasFile, since]);

  const narrowed = Boolean(inChannel || fromId || hasFile || when !== "any");

  const total = results.messages.length + results.files.length + results.people.length;

  const FILTERS: { id: Filter; label: string; n: number }[] = [
    { id: "all", label: t("search.all", "All"), n: total },
    { id: "messages", label: t("search.messages", "Messages"), n: results.messages.length },
    { id: "files", label: t("search.files", "Files"), n: results.files.length },
    { id: "people", label: t("search.people", "People"), n: results.people.length },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header
        className={"shrink-0 px-4 py-2.5 "+("ch-background-a8869d")}

      >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/hq/chat")}
      >
        <ArrowLeft size={14} weight="bold" aria-hidden="true" className="rtl:-scale-x-100" />
        {t("search.backToChat", "Back to Chat")}
      </Button>
        <form
          role="search"
          className="mt-2 max-w-xl"
          onSubmit={(e) => {
            e.preventDefault();
            const next = draft.trim();
            router.replace(next ? `/hq/chat/search?q=${encodeURIComponent(next)}` : "/hq/chat/search");
          }}
        >
          <Input
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label={t("search.field", "Search messages, files and people")}
            placeholder={t("search.field", "Search messages, files and people")}
            startIcon={<MagnifyingGlass aria-hidden="true" />}
          />
        </form>
        <div className="flex items-baseline gap-2.5">
          <h1 className={"hq-title "+("ch-color-7f7330")} >
            {t("search.title", "Search")}
          </h1>
          <span className={"tabular text-body-sm "+("ch-color-4a0211")} >
            {t("search.resultsFor", "{n} results for “{q}”", { n: total, q: query })}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <Button
              key={f.id}
              size="sm"
              variant={filter === f.id ? "secondary" : "ghost"}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={(filter === f.id?"ch-background-1416a8"+' '+"ch-color-55f463"+' '+"ch-border-color-c4235e":"")}
            >
              {f.label}
              <span className={"tabular "+("ch-opacity-383082")} >
                {f.n}
              </span>
            </Button>
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!q ? (
          <EmptyState
            icon={<MagnifyingGlass size={20} aria-hidden="true" />}
            title={t("search.startTitle", "Search the workspace")}
            body={t("search.startHint", "Type above to search messages, files and people you can see.")}
          />
        ) : total === 0 ? (
          <EmptyState
            icon={<MagnifyingGlass size={20} aria-hidden="true" />}
            title={t("search.noneTitle", "Nothing matched “{q}”", { q: query })}
            body={t("search.noneBody", "Try fewer words, or search for the person who would have said it.")}
          />
        ) : (
          <div className="mx-auto w-full max-w-[720px] px-4 py-4">
            {filter !== "people" && (
              <div className="flex flex-wrap items-center gap-2 pb-4" role="group" aria-label={t("search.narrow", "Narrow the results")}>
                <select value={inChannel} onChange={(e) => setInChannel(e.target.value)} aria-label={t("search.inChannel", "In")} className={"ch-background-751d03"+' '+"ch-border-8ff264"+' '+"ch-border-radius-332348"+' '+"ch-padding-7aab68"+' '+"ch-font-size-ba0694"+' '+"ch-min-height-dace99"+' '+"ch-color-7f7330"} >
                  <option value="">{t("search.anyChannel", "Any conversation")}</option>
                  {channels
                    .filter((c) => !c.archived)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.kind === "public" || c.kind === "private" ? `#${c.name}` : c.name}
                      </option>
                    ))}
                </select>
                <select value={fromId} onChange={(e) => setFromId(e.target.value)} aria-label={t("search.from", "From")} className={"ch-background-751d03"+' '+"ch-border-8ff264"+' '+"ch-border-radius-332348"+' '+"ch-padding-7aab68"+' '+"ch-font-size-ba0694"+' '+"ch-min-height-dace99"+' '+"ch-color-7f7330"} >
                  <option value="">{t("search.anyone", "Anyone")}</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <select value={when} onChange={(e) => setWhen(e.target.value as typeof when)} aria-label={t("search.when", "When")} className={"ch-background-751d03"+' '+"ch-border-8ff264"+' '+"ch-border-radius-332348"+' '+"ch-padding-7aab68"+' '+"ch-font-size-ba0694"+' '+"ch-min-height-dace99"+' '+"ch-color-7f7330"} >
                  <option value="any">{t("search.anyTime", "Any time")}</option>
                  <option value="today">{t("search.today", "Today")}</option>
                  <option value="week">{t("search.week", "Last 7 days")}</option>
                  <option value="month">{t("search.month", "Last 30 days")}</option>
                </select>
                <label className={"flex cursor-pointer items-center gap-1.5 text-body-sm "+("ch-color-7f7330")} >
                  <input type="checkbox" checked={hasFile} onChange={(e) => setHasFile(e.target.checked)} className={"ch-width-eb53b5"+' '+"ch-height-946a99"+' '+"ch-accent-color-e56d5b"}  />
                  {t("search.hasFile", "Has a file")}
                </label>
                {narrowed && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setInChannel("");
                      setFromId("");
                      setHasFile(false);
                      setWhen("any");
                    }}
                  >
                    {t("search.clear", "Clear")}
                  </Button>
                )}
              </div>
            )}

            {(filter === "all" || filter === "people") && results.people.length > 0 && (
              <Section title={t("search.people", "People")}>
                {results.people.map((u) => (
                  <PersonResult key={u.id} userId={u.id} name={u.name} initials={u.initials} tint={u.tint} title={u.title} />
                ))}
              </Section>
            )}

            {(filter === "all" || filter === "files") && results.files.length > 0 && (
              <Section title={t("search.files", "Files")}>
                {results.files.map(({ file, message }) => (
                  <li key={file.id}>
                    <Link
                      href={`/hq/chat/${message.channelId}#${message.id}`}
                      className={"hq-row flex items-center gap-2.5 px-3 py-2.5 "+("ch-border-radius-8d459a"+' '+"ch-border-5065d4"+' '+"ch-background-751d03")}

                    >
                      <FileText size={16} aria-hidden="true" className={"ch-color-4a0211"}  />
                      <span className={"flex-1 truncate text-body-sm font-medium "+("ch-color-7f7330")} >
                        <bdi>{file.name}</bdi>
                      </span>
                      <span className={"tabular text-caption "+("ch-color-094083")} >
                        {file.size}
                      </span>
                    </Link>
                  </li>
                ))}
              </Section>
            )}

            {(filter === "all" || filter === "messages") && results.messages.length > 0 && (
              <Section title={t("search.messages", "Messages")}>
                {results.messages.map((m) => {
                  const author = users.find((u) => u.id === m.authorId);
                  const channel = channels.find((c) => c.id === m.channelId);
                  return (
                    <li key={m.id}>
                      <Link
                        href={`/hq/chat/${m.channelId}#${m.id}`}
                        className={"hq-row flex flex-col gap-1.5 px-3 py-2.5 "+("ch-border-radius-8d459a"+' '+"ch-border-5065d4"+' '+"ch-background-751d03")}

                      >
                        <span className="flex items-center gap-2">
                          <Hash size={12} weight="bold" aria-hidden="true" className={"ch-color-094083"}  />
                          <span className={"text-caption font-medium "+("ch-color-4a0211")} >
                            <bdi>{channel?.name}</bdi>
                          </span>
                          <span className={"tabular ms-auto text-caption "+("ch-color-094083")} >
                            {formatRelative(m.createdAt)}
                          </span>
                        </span>
                        <span className="flex items-start gap-2.5">
                          {author && (
                            <Avatar name={author.name} initials={author.initials} tint={author.tint} size={20} hideStatus />
                          )}
                          <span className={"min-w-0 flex-1 text-body-sm leading-snug "+("ch-color-7f7330")} >
                            <bdi><Highlight text={m.text} term={q} /></bdi>
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pb-5">
      <h2 className={"pb-2 text-body-sm font-semibold "+("ch-color-7f7330")} >
        {title}
      </h2>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  );
}

function PersonResult({
  userId,
  name,
  initials,
  tint,
  title,
}: {
  userId: string;
  name: string;
  initials: string;
  tint: number;
  title: string;
}) {
  const presence = usePresenceOf(userId);
  const openDm = useWorkspace((s) => s.openOrCreateDm);
  const router = useRouter();
  const t = useT();

  /* This carried hover styling while being a plain div, so it looked like a
     control and was not one. Opening the conversation is what a person result
     is for; if the two have never spoken, the conversation is created. */
  return (
    <li>
      <button
        type="button"
        onClick={() => router.push(`/hq/chat/${openDm(userId)}`)}
        className={"hq-row flex w-full items-center gap-2.5 px-3 py-2.5 text-start "+("ch-border-radius-8d459a"+' '+"ch-border-5065d4"+' '+"ch-background-751d03"+' '+"ch-min-height-5d0881")}

      >
        <Avatar name={name} initials={initials} tint={tint} status={presence?.status} size={28} />
        <span className={"flex-1 text-body-sm font-medium "+("ch-color-7f7330")} >
          {name}
        </span>
        <span className={"hidden text-caption sm:inline "+("ch-color-4a0211")} >
          {title}
        </span>
        <span className={"text-caption font-medium "+("ch-color-55f463")} >
          {t("search.message", "Message")}
        </span>
      </button>
    </li>
  );
}

function Highlight({ text, term }: { text: string; term: string }) {
  const i = text.toLowerCase().indexOf(term);
  if (i < 0 || !term) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className={"ch-background-1416a8"+' '+"ch-color-55f463"+' '+"ch-font-weight-eed0f8"} >
        {text.slice(i, i + term.length)}
      </mark>
      {text.slice(i + term.length)}
    </>
  );
}

const selectStyle: React.CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-hairline-strong)",
  borderRadius: "var(--radius-control)",
  padding: "6px 10px",
  fontSize: 12.5,
  minHeight: 32,
  color: "var(--color-ink)",
};
