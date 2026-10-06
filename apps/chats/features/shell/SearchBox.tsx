"use client";

/**
 * SOMION HQ - SEARCH BOX
 *
 * Search that answers as you type. The previous version only worked if you
 * knew to press Enter, which is a hidden interaction: to anyone else the field
 * simply did nothing.
 *
 * The preview and the full results page read the same selector, so the two can
 * never disagree about what matches - a preview promising a result the page
 * does not contain is the classic way this feature loses trust.
 *
 * Keyboard is the point, not an afterthought: `/` focuses, arrows move,
 * Enter opens the highlighted row, Enter with nothing highlighted runs the
 * full search, Escape closes and leaves the text alone.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Hash, Lock, MagnifyingGlass, FileText, ChatTeardropText } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { useSearchResults } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { useT } from "@/lib/i18n";

interface Row {
  id: string;
  /** Where the row goes. Absent on a person, whose target is resolved on click. */
  href?: string;
  /** Set on a person row; the conversation is opened or created on activation. */
  userId?: string;
  kind: "person" | "channel" | "message" | "file";
  title: string;
  meta: string;
  node: React.ReactNode;
}

const PREVIEW_PER_GROUP = 3;

export function SearchBox() {
  const router = useRouter();
  const t = useT();
  const channels = useWorkspace((s) => s.channels);
  const users = useWorkspace((s) => s.users);
  const openDm = useWorkspace((s) => s.openOrCreateDm);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const results = useSearchResults(query);

  /* A flat list, because the keyboard moves through rows and does not care
     that they are grouped on screen. */
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];

    results.people.slice(0, PREVIEW_PER_GROUP).forEach((u) => {
      out.push({
        id: `p-${u.id}`,
        /* Resolved on activation rather than up front, because opening a
           person creates the conversation when there is not one yet - and
           building the list must not create nine of them. */
        kind: "person",
        title: u.name,
        meta: u.title,
        userId: u.id,
        node: <Avatar name={u.name} initials={u.initials} tint={u.tint} size={20} hideStatus />,
      });
    });

    results.channels.slice(0, PREVIEW_PER_GROUP).forEach((c) => {
      out.push({
        id: `c-${c.id}`,
        href: `/hq/chat/${c.id}`,
        kind: "channel",
        title: `#${c.name}`,
        meta: c.topic ?? t("search.channel", "Channel"),
        node:
          c.kind === "private" ? (
            <Lock size={14} aria-hidden="true" style={{ color: "var(--color-ink-subtle)" }} />
          ) : (
            <Hash size={14} aria-hidden="true" style={{ color: "var(--color-ink-subtle)" }} />
          ),
      });
    });

    results.messages.slice(0, PREVIEW_PER_GROUP).forEach((m) => {
      const author = users.find((u) => u.id === m.authorId);
      const ch = channels.find((c) => c.id === m.channelId);
      out.push({
        id: `m-${m.id}`,
        href: `/hq/chat/${m.channelId}`,
        kind: "message",
        title: m.text,
        meta: `${author?.name ?? ""} · ${ch ? (ch.kind === "dm" ? ch.name : `#${ch.name}`) : ""}`,
        node: <ChatTeardropText size={14} aria-hidden="true" style={{ color: "var(--color-ink-subtle)" }} />,
      });
    });

    results.files.slice(0, PREVIEW_PER_GROUP).forEach(({ file, message }) => {
      out.push({
        id: `f-${file.id}`,
        href: `/hq/chat/${message.channelId}`,
        kind: "file",
        title: file.name,
        meta: file.size,
        node: <FileText size={14} aria-hidden="true" style={{ color: "var(--color-ink-subtle)" }} />,
      });
    });

    return out;
  }, [results, channels, users, t]);

  /* Reset the highlight whenever the result set changes, so Enter never opens
     a row the person can no longer see. */
  useEffect(() => setActive(-1), [query]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  /* `/` focuses search, the convention this audience knows from Slack. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    inputRef.current?.blur();
    router.push(href);
  };

  const openRow = (row: Row) => {
    if (row.userId) go(`/hq/chat/${openDm(row.userId)}`);
    else if (row.href) go(row.href);
  };

  const seeAll = () => {
    if (!query.trim()) return;
    go(`/hq/chat/search?q=${encodeURIComponent(query.trim())}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (rows.length === 0) return;
      e.preventDefault();
      setOpen(true);
      setActive((i) => {
        const next = e.key === "ArrowDown" ? i + 1 : i - 1;
        if (next < 0) return rows.length - 1;
        if (next >= rows.length) return 0;
        return next;
      });
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const row = active >= 0 ? rows[active] : undefined;
      if (row) openRow(row);
      else seeAll();
    }
  };

  const showPanel = open && query.trim().length > 0;

  return (
    <div ref={boxRef} className="relative mx-auto hidden w-full max-w-[440px] sm:block">
      <div className="relative" role="search">
        <MagnifyingGlass
          size={15}
          aria-hidden="true"
          className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2"
          style={{ color: "var(--color-ink-subtle)" }}
        />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="hq-search-results"
          aria-autocomplete="list"
          {...(active >= 0 && rows[active] ? { "aria-activedescendant": `hq-sr-${rows[active].id}` } : {})}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t("shell.search", "Search messages, files and people")}
          aria-label={t("shell.search", "Search messages, files and people")}
          className="w-full"
          style={{
            background: "var(--color-surface-sunken)",
            border: "1px solid transparent",
            borderRadius: "var(--radius-control)",
            padding: "7px 11px 7px 30px",
            fontSize: "13px",
            minHeight: 34,
          }}
        />
      </div>

      {showPanel && (
        <div
          id="hq-search-results"
          role="listbox"
          aria-label={t("search.results", "Search results")}
          className="hq-floating hq-rise hq-dropdown absolute inset-x-0 top-full z-[70] mt-1.5 overflow-hidden"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          {results.total === 0 ? (
            <p className="px-3.5 py-4 text-[12.5px]" style={{ color: "var(--color-ink-muted)" }}>
              {t("search.noneFor", "Nothing matches “{q}”.", { q: query.trim() })}
            </p>
          ) : (
            <ul className="max-h-[380px] overflow-y-auto py-1">
              {(["person", "channel", "message", "file"] as const).map((kind) => {
                const group = rows.filter((r) => r.kind === kind);
                if (group.length === 0) return null;
                const heading = {
                  person: t("search.people", "People"),
                  channel: t("search.channels", "Channels"),
                  message: t("search.messages", "Messages"),
                  file: t("search.files", "Files"),
                }[kind];
                return (
                  <li key={kind}>
                    <p
                      className="px-3 pb-1 pt-2 text-[11px] font-semibold"
                      style={{ color: "var(--color-ink-subtle)" }}
                    >
                      {heading}
                    </p>
                    <ul>
                      {group.map((r) => {
                        const i = rows.indexOf(r);
                        const on = i === active;
                        return (
                          <li key={r.id}>
                            <button
                              id={`hq-sr-${r.id}`}
                              role="option"
                              aria-selected={on}
                              onMouseEnter={() => setActive(i)}
                              onClick={() => openRow(r)}
                              className="flex w-full items-center gap-2.5 px-3 py-1.5 text-start"
                              style={{
                                background: on ? "var(--color-accent-soft)" : "transparent",
                                minHeight: 38,
                              }}
                            >
                              <span className="flex w-[20px] shrink-0 justify-center">{r.node}</span>
                              <span className="min-w-0 flex-1">
                                <span
                                  className="block truncate text-[13px]"
                                  style={{ color: on ? "var(--color-ink-brand)" : "var(--color-ink)" }}
                                >
                                  <Mark text={r.title} term={query.trim()} />
                                </span>
                                <span
                                  className="block truncate text-[11.5px]"
                                  style={{ color: "var(--color-ink-muted)" }}
                                >
                                  {r.meta}
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}

          <button
            onClick={seeAll}
            className="hq-row flex w-full items-center gap-2 px-3.5 text-start text-[12.5px] font-medium"
            style={{
              borderTop: "1px solid var(--color-hairline)",
              color: "var(--color-ink-brand)",
              minHeight: 40,
            }}
          >
            <MagnifyingGlass size={13} weight="bold" aria-hidden="true" />
            {t("search.seeAll", "See all results for “{q}”", { q: query.trim() })}
          </button>
        </div>
      )}
    </div>
  );
}

/** The matched run, marked so the reason a row is here is visible. */
function Mark({ text, term }: { text: string; term: string }) {
  if (!term) return <>{text}</>;
  const i = text.toLowerCase().indexOf(term.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark style={{ background: "var(--color-brand-100)", color: "inherit", padding: "0 1px" }}>
        {text.slice(i, i + term.length)}
      </mark>
      {text.slice(i + term.length)}
    </>
  );
}
