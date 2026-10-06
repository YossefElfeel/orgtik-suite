"use client";

// Reactions on one comment. A chip is pressed when the person looking has reacted — not the
// comment's author (TASKS-037). Read-only viewers see the counts as text.
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Smiley } from "@phosphor-icons/react";
import { IconButton, Popover, PopoverContent, PopoverTrigger, Tooltip, cn } from "@orgtik/ui";
import { CommentReactionEnum, REACTION_EMOJIES_SYMPOLS } from "@/constants/emojies";
import { isolate } from "@/lib/bidi";
import { useAppSelector } from "@/redux/app/hooks";
import { useAddReactionMutation, useRemoveReactionMutation } from "@/redux/features/comments/commentsApi";
import type { IReaction } from "@/types/comments";
import { fullName } from "./text";

const ALL = Object.values(CommentReactionEnum);

export function Reactions({ commentId, reactions, readOnly }: { commentId: number; reactions: IReaction[]; readOnly: boolean }) {
  const t = useTranslations("TaskComments");
  const locale = useLocale();
  const me = useAppSelector((s) => s.auth.user);
  const [add, addState] = useAddReactionMutation();
  const [remove, removeState] = useRemoveReactionMutation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const busy = addState.isLoading || removeState.isLoading;
  const shown = reactions.filter((r) => r.count > 0);

  const mine = (reaction: string) =>
    !!me && !!reactions.find((r) => r.reaction === reaction)?.users?.some((u) => u.id === me.id);

  const toggle = async (reaction: CommentReactionEnum) => {
    if (busy || readOnly) return;
    try {
      if (mine(reaction)) await remove({ commentId, reaction }).unwrap();
      else await add({ commentId, reaction }).unwrap();
    } catch {
      // The api-feedback registry already said what went wrong.
    }
  };

  const names = (r: IReaction) => {
    const list = (r.users ?? []).map((u) => isolate(fullName(u)));
    try {
      return new Intl.ListFormat(locale, { type: "conjunction" }).format(list);
    } catch {
      return list.join(", ");
    }
  };

  if (readOnly) {
    if (!shown.length) return null;
    return (
      <ul className="flex flex-wrap items-center gap-1" aria-label={t("reactionsLabel")}>
        {shown.map((r) => (
          <li key={r.reaction} className="inline-flex items-center gap-1 rounded-pill bg-sunken px-2 py-0.5 text-caption text-fg-muted">
            <span aria-hidden="true">{REACTION_EMOJIES_SYMPOLS[r.reaction]}</span>
            <span aria-hidden="true" className="tabular-nums">{r.count}</span>
            <span className="sr-only">{t("reactionCount", { reaction: t(`reaction.${r.reaction}`), count: r.count })}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t("reactionsLabel")}>
      {shown.map((r) => {
        const pressed = mine(r.reaction);
        return (
          <Tooltip key={r.reaction} content={t("reactedBy", { names: names(r) })}>
            <button
              type="button"
              aria-pressed={pressed}
              aria-label={t("reactionCount", { reaction: t(`reaction.${r.reaction}`), count: r.count })}
              disabled={busy}
              onClick={() => toggle(r.reaction)}
              className={cn(
                "inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-caption transition-colors",
                "focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-wait",
                pressed ? "border-action-primary bg-brand-subtle text-fg-brand" : "border-line bg-sunken text-fg-muted hover:bg-hover",
              )}
            >
              <span aria-hidden="true">{REACTION_EMOJIES_SYMPOLS[r.reaction]}</span>
              <span aria-hidden="true" className="tabular-nums">{r.count}</span>
            </button>
          </Tooltip>
        );
      })}
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger
          render={<IconButton variant="ghost" size="sm" label={t("addReaction")} icon={<Smiley aria-hidden="true" />} />}
        />
        <PopoverContent side="top" align="start" className="p-1">
          <div role="group" aria-label={t("addReaction")} className="flex items-center gap-0.5">
            {ALL.map((reaction) => {
              const pressed = mine(reaction);
              return (
                <button
                  key={reaction}
                  type="button"
                  aria-pressed={pressed}
                  aria-label={t(`reaction.${reaction}`)}
                  title={t(`reaction.${reaction}`)}
                  disabled={busy}
                  onClick={() => {
                    setPickerOpen(false);
                    void toggle(reaction);
                  }}
                  className={cn(
                    "grid size-9 place-items-center rounded-pill text-body-lg transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-focus",
                    pressed ? "bg-brand-subtle" : "hover:bg-hover",
                  )}
                >
                  <span aria-hidden="true">{REACTION_EMOJIES_SYMPOLS[reaction]}</span>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
