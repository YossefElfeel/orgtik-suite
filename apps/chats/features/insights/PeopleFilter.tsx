"use client";

/**
 * SOMION HQ - PEOPLE FILTER
 *
 * Which people the numbers describe. It is a cohort picker, not a person
 * picker: the page below it shows team totals, and a team is at least the
 * workspace minimum. Pick fewer and the page says so instead of showing a
 * number that is really one person - with one exception, which is you.
 * Everyone may see their own numbers, so "Only me" is always allowed.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { CaretDown, Check, MagnifyingGlass, UsersThree } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, Chip } from "@/components/ui/Primitives";
import { useBackToClose, useEscape } from "@/lib/useDismiss";
import { useT } from "@/lib/i18n";
import type { Id, User } from "@/entities";

export function PeopleFilter({
  users,
  me,
  value,
  onChange,
  minCohort,
}: {
  users: User[];
  me: Id;
  /** null means everyone. */
  value: Id[] | null;
  onChange: (v: Id[] | null) => void;
  minCohort: number;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const close = () => setOpen(false);
  useBackToClose(open, close);
  useEscape(open, close);

  useEffect(() => {
    if (!open) return;
    setQ("");
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    /* preventScroll: the input is already in view, and a scroll here would
       carry the page's own scroll container with it. */
    setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 0);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const selected = value ?? users.map((u) => u.id);
  const isEveryone = value === null;
  const onlyMe = selected.length === 1 && selected[0] === me;
  const short = isEveryone || selected.length >= minCohort || onlyMe ? null : selected.length;

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? users.filter((u) => `${u.name} ${u.title}`.toLowerCase().includes(needle)) : users;
  }, [users, q]);

  const toggle = (id: Id) => {
    const set = new Set(selected);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    const next = users.map((u) => u.id).filter((x) => set.has(x));
    onChange(next.length === users.length ? null : next);
  };

  const quick: { id: string; label: string; ids: Id[] | null }[] = [
    { id: "everyone", label: t("people.everyone", "Everyone"), ids: null },
    { id: "me", label: t("people.onlyMe", "Only me"), ids: [me] },
    { id: "admins", label: t("people.admins", "Admins"), ids: users.filter((u) => u.role === "admin" || u.role === "owner").map((u) => u.id) },
    { id: "members", label: t("people.members", "Members"), ids: users.filter((u) => u.role === "member").map((u) => u.id) },
  ];

  const buttonLabel = isEveryone
    ? t("people.everyone", "Everyone")
    : onlyMe
      ? t("people.onlyYou", "Only you")
      : t("people.nPeople", "{n} people", { n: selected.length });

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={"hq-btn flex items-center gap-2 ps-2.5 pe-2 "+("ch-min-height-87483b"+' '+"ch-border-radius-332348"+' '+"ch-border-8ff264"+' '+"ch-background-751d03"+' '+"ch-font-size-ba0694"+' '+"ch-color-7f7330")}

      >
        <UsersThree size={14} aria-hidden="true" className={"ch-color-4a0211"}  />
        <span className="font-medium">{buttonLabel}</span>
        {short !== null && <Chip tone="accent">{t("people.tooFewChip", "below {n}", { n: minCohort })}</Chip>}
        <CaretDown size={11} weight="bold" aria-hidden="true" className={"ch-color-094083"}  />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("people.title", "Choose people")}
          className={"hq-floating hq-rise hq-dropdown absolute start-0 z-50 mt-2 flex w-[340px] flex-col "+("ch-border-radius-8d459a"+' '+"ch-background-751d03")}

        >
          <div className="p-2">
            <label className="relative block">
              <MagnifyingGlass size={13} aria-hidden="true" className={"absolute start-2.5 top-1/2 -translate-y-1/2 "+("ch-color-094083")}  />
              <input
                ref={searchRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label={t("people.search", "Search people")}
                placeholder={t("people.search", "Search people")}
                className={"w-full ps-8 pe-2 "+("ch-min-height-dace99"+' '+"ch-font-size-ba0694"+' '+"ch-color-7f7330"+' '+"ch-background-314b28"+' '+"ch-border-52e799"+' '+"ch-border-radius-332348")}

              />
            </label>
            <div className="mt-2 flex flex-wrap gap-1">
              {quick.map((qk) => {
                const on = qk.ids === null ? isEveryone : !isEveryone && qk.ids.length === selected.length && qk.ids.every((id) => selected.includes(id));
                return (
                  <button
                    key={qk.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onChange(qk.ids)}
                    className={"hq-btn px-2.5 text-caption font-medium "+("ch-min-height-4ce73c"+' '+"ch-border-radius-189003"+' '+(on?"ch-border-c98846":"ch-border-8ff264")+' '+(on?"ch-background-1416a8":"ch-background-751d03")+' '+"ch-color-7f7330")}

                  >
                    {qk.label}
                  </button>
                );
              })}
            </div>
          </div>

          <ul
            role="listbox"
            aria-multiselectable="true"
            aria-label={t("people.list", "People")}
            className={"max-h-[280px] overflow-y-auto border-t px-1 py-1 "+("ch-border-color-407eb5")}

          >
            {shown.map((u) => {
              const on = selected.includes(u.id);
              return (
                <li key={u.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => toggle(u.id)}
                    className={"hq-row flex w-full items-center gap-2.5 px-2 text-start "+("ch-min-height-fd2692"+' '+"ch-border-radius-332348")}

                  >
                    <Avatar name={u.name} initials={u.initials} tint={u.tint} size={28} hideStatus />
                    <span className="min-w-0 flex-1">
                      <span className={"block truncate text-body-sm font-medium "+("ch-color-7f7330")} >
                        <bdi>{u.name}</bdi>
                        {u.id === me && <span className={"ch-color-094083"} > · {t("people.you", "you")}</span>}
                      </span>
                      <span className={"block truncate text-caption "+("ch-color-4a0211")} >
                        <bdi>{u.title}</bdi>
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={"inline-flex items-center justify-center "+("ch-width-f74111"+' '+"ch-height-ad1b79"+' '+"ch-border-radius-edd97e"+' '+(on?"ch-border-9cf269":"ch-border-0ff7e9")+' '+(on?"ch-background-3f17cb":"ch-background-a8869d")+' '+"ch-color-7b8a5e")}

                    >
                      {on && <Check size={11} weight="bold" />}
                    </span>
                  </button>
                </li>
              );
            })}
            {shown.length === 0 && (
              <li className={"px-3 py-3 text-body-sm "+("ch-color-4a0211")} >
                {t("people.none", "Nobody matches.")}
              </li>
            )}
          </ul>

          <div className={"flex items-center gap-2 border-t p-2 "+("ch-border-color-407eb5")} >
            <span className={"tabular min-w-0 flex-1 text-caption "+((short !== null?"ch-color-7f7330":"ch-color-4a0211"))} >
              {short !== null
                ? t("people.needMore", "{n} selected. Team numbers need at least {min}, or only you.", { n: short, min: minCohort })
                : isEveryone
                  ? t("people.allSelected", "Everyone, {n} people", { n: users.length })
                  : t("people.nSelected", "{n} selected", { n: selected.length })}
            </span>
            <Button size="sm" variant="primary" onClick={close}>
              {t("common.done", "Done")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
