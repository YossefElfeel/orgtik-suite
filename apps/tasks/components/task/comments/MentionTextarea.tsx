"use client";

// A textarea that suggests project members after "@". The suggestions follow the ARIA
// autocomplete-list pattern: focus stays in the textarea, which points at the highlighted option
// with aria-activedescendant; ↑/↓ move, Enter or Tab picks, Esc closes (and only closes the list,
// not the sheet around it).
import { forwardRef, useId, useImperativeHandle, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { Avatar, Textarea, cn } from "@orgtik/ui";
import type { IProjectMember } from "@/types/projects";
import { fullName, mentionAt, type PickedMention } from "./text";

const MAX_SUGGESTIONS = 8;

export type MentionTextareaHandle = { focus: () => void };

type Props = {
  value: string;
  onChange: (value: string) => void;
  mentions: PickedMention[];
  onMentionsChange: (mentions: PickedMention[]) => void;
  members: IProjectMember[];
  label: string;
  placeholder?: string;
  describedBy?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  rows?: number;
  /** Keys the list didn't use (Ctrl+Enter to send, Esc to cancel an edit). */
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
};

export const MentionTextarea = forwardRef<MentionTextareaHandle, Props>(function MentionTextarea(
  { value, onChange, mentions, onMentionsChange, members, label, placeholder, describedBy, disabled, autoFocus, rows = 3, onKeyDown },
  ref,
) {
  const t = useTranslations("TaskComments");
  const listId = useId();
  const area = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState<{ start: number; query: string } | null>(null);
  const [active, setActive] = useState(0);
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);

  useImperativeHandle(ref, () => ({ focus: () => area.current?.focus() }), []);

  const suggestions = useMemo(() => {
    if (!query) return [];
    const q = query.query.toLocaleLowerCase();
    return members
      .filter((m) => {
        const name = fullName(m).toLocaleLowerCase();
        return !q || name.split(/\s+/).some((part) => part.startsWith(q)) || name.includes(q);
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [members, query]);

  const open = !!query && dismissedAt !== query.start;
  const activeIndex = Math.min(active, Math.max(suggestions.length - 1, 0));
  const optionId = (i: number) => `${listId}-opt-${i}`;

  const sync = (text: string, caret: number) => {
    const next = mentionAt(text, caret);
    setQuery(next);
    if (!next || next.start !== query?.start) setDismissedAt(null);
    if (next?.query !== query?.query) setActive(0);
  };

  const pick = (m: IProjectMember) => {
    if (!query) return;
    const label = fullName(m);
    const caret = query.start + 1 + query.query.length;
    const insert = `@${label} `;
    const next = value.slice(0, query.start) + insert + value.slice(caret);
    onChange(next);
    if (!mentions.some((x) => x.id === m.id)) onMentionsChange([...mentions, { id: m.id, label }]);
    setQuery(null);
    const pos = query.start + insert.length;
    requestAnimationFrame(() => {
      area.current?.focus();
      area.current?.setSelectionRange(pos, pos);
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (open) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setDismissedAt(query!.start);
        return;
      }
      if (suggestions.length) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          const step = e.key === "ArrowDown" ? 1 : -1;
          setActive((activeIndex + step + suggestions.length) % suggestions.length);
          return;
        }
        if ((e.key === "Enter" && !e.ctrlKey && !e.metaKey && !e.shiftKey) || e.key === "Tab") {
          e.preventDefault();
          pick(suggestions[activeIndex]);
          return;
        }
      }
    }
    onKeyDown?.(e);
  };

  return (
    <div className="relative">
      <Textarea
        ref={area}
        dir="auto"
        rows={rows}
        maxRows={10}
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label={label}
        aria-describedby={describedBy}
        aria-autocomplete="list"
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && suggestions.length ? optionId(activeIndex) : undefined}
        onChange={(e) => {
          onChange(e.target.value);
          sync(e.target.value, e.target.selectionStart ?? e.target.value.length);
        }}
        onSelect={(e) => {
          const el = e.currentTarget;
          if (el.selectionStart === el.selectionEnd) sync(el.value, el.selectionStart ?? 0);
        }}
        onBlur={() => setQuery(null)}
        onKeyDown={handleKeyDown}
        className="w-full"
      />
      {open ? (
        <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-card border border-line bg-overlay shadow-overlay">
          {suggestions.length ? (
            <ul id={listId} role="listbox" aria-label={t("mentionListLabel")} className="max-h-60 overflow-y-auto py-1">
              {suggestions.map((m, i) => {
                const name = fullName(m);
                return (
                  <li
                    key={m.id}
                    id={optionId(i)}
                    role="option"
                    aria-selected={i === activeIndex}
                    // Keep focus (and the caret) in the textarea while choosing with the mouse.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(m)}
                    onMouseEnter={() => setActive(i)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 px-3 py-1.5 text-body-sm text-fg",
                      i === activeIndex && "bg-hover",
                    )}
                  >
                    <Avatar name={name} src={m.avatar} size="xs" decorative />
                    <span dir="auto" className="min-w-0 flex-1 truncate">
                      {name}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p id={listId} className="px-3 py-2 text-body-sm text-fg-muted">
              {t("noMentionMatch")}
            </p>
          )}
        </div>
      ) : null}
      <span role="status" className="sr-only">
        {open ? t("mentionResults", { count: suggestions.length }) : ""}
      </span>
    </div>
  );
});
