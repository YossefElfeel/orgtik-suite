"use client";
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, DotsSixVertical, DotsThreeVertical, PencilSimple, Trash } from "@phosphor-icons/react";
import {
  Button,
  Checkbox,
  IconButton,
  Input,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  cn,
} from "@orgtik/ui";
import { isolate } from "@/lib/bidi";
import type { ISetupItem } from "@/types/tasks";

export type SubtaskSize = "compact" | "large";

type Pending = "rename" | "delete" | "up" | "down" | null;

/**
 * One subtask: [reorder handle] [checkbox named by the title] … [actions menu].
 * Every control is a sibling: nothing interactive sits inside another.
 * The menu holds Rename, Move up, Move down and Delete; Move up/down is the way to reorder
 * without dragging (WCAG 2.5.7).
 */
export function SubtaskRow({
  subtask,
  index,
  total,
  readOnly,
  size,
  onToggle,
  onRename,
  onMove,
  onDelete,
}: {
  subtask: ISetupItem;
  index: number;
  total: number;
  readOnly: boolean;
  size: SubtaskSize;
  onToggle: (subtask: ISetupItem, checked: boolean) => void;
  onRename: (subtask: ISetupItem, title: string) => Promise<boolean>;
  onMove: (subtask: ISetupItem, from: number, to: number) => void;
  onDelete: (subtask: ISetupItem) => void;
}) {
  const t = useTranslations("TaskSubtasks");
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: subtask.id,
    disabled: readOnly,
  });

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(subtask.title);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // What to do once the menu has finished closing (and handed focus back to its trigger), so the
  // rename field or the confirm dialog isn't fighting the menu for focus.
  const pending = useRef<Pending>(null);
  // After a move, React may re-insert this row's node, which drops focus: put it back.
  const refocus = useRef(false);

  useLayoutEffect(() => {
    if (refocus.current) {
      refocus.current = false;
      triggerRef.current?.focus();
    }
  }, [index]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const startEdit = () => {
    setDraft(subtask.title);
    setEditing(true);
  };

  const finishEdit = () => {
    setEditing(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const save = async () => {
    const title = draft.trim();
    if (!title) return;
    if (title === subtask.title) return finishEdit();
    setSaving(true);
    const ok = await onRename(subtask, title);
    setSaving(false);
    if (ok) finishEdit();
    else inputRef.current?.focus();
  };

  const onEditKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void save();
    } else if (e.key === "Escape") {
      // Keep the sheet or dialog around us open: Esc here only leaves the field.
      e.preventDefault();
      e.stopPropagation();
      finishEdit();
    }
  };

  const runPending = (open: boolean) => {
    if (open) return;
    const action = pending.current;
    pending.current = null;
    if (action === "rename") startEdit();
    else if (action === "delete") onDelete(subtask);
    else if (action === "up" || action === "down") {
      refocus.current = true;
      onMove(subtask, index, action === "up" ? index - 1 : index + 1);
    }
  };

  const large = size === "large";

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "relative flex items-start gap-2 rounded-card border border-line bg-raised",
        large ? "px-3 py-2.5" : "px-2 py-1.5",
        isDragging && "z-10 shadow-raised"
      )}
    >
      {!readOnly && !editing ? (
        <IconButton
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          variant="ghost"
          size="sm"
          label={t("reorderHandle", { title: isolate(subtask.title) })}
          icon={<DotsSixVertical weight="bold" />}
          className="shrink-0 cursor-grab touch-none text-fg-subtle active:cursor-grabbing"
        />
      ) : null}

      {editing ? (
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <Input
            ref={inputRef}
            dir="auto"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onEditKey}
            aria-label={t("renameLabel", { title: isolate(subtask.title) })}
            maxLength={255}
            className="min-w-40 flex-1"
          />
          <div className="flex items-center gap-1">
            <Button size="sm" onClick={() => void save()} loading={saving} disabled={!draft.trim()}>
              {t("save")}
            </Button>
            <Button size="sm" variant="ghost" onClick={finishEdit}>
              {t("cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <Checkbox
          checked={subtask.isCompleted}
          onCheckedChange={(checked) => onToggle(subtask, checked === true)}
          readOnly={readOnly}
          className={cn("min-w-0 flex-1", large ? "py-1" : "py-1.5", readOnly && "cursor-default")}
          label={
            <span
              dir="auto"
              className={cn(
                "break-words",
                large ? "text-body" : "text-body-sm",
                subtask.isCompleted ? "text-fg-muted line-through" : "text-fg"
              )}
            >
              {subtask.title}
            </span>
          }
        />
      )}

      {!readOnly && !editing ? (
        <Menu onOpenChangeComplete={runPending}>
          <MenuTrigger
            ref={triggerRef}
            render={
              <IconButton
                variant="ghost"
                size="sm"
                label={t("actionsFor", { title: isolate(subtask.title) })}
                icon={<DotsThreeVertical weight="bold" />}
                className="shrink-0 text-fg-muted"
              />
            }
          />
          <MenuContent align="end">
            <MenuItem icon={<PencilSimple />} onClick={() => (pending.current = "rename")}>
              {t("rename")}
            </MenuItem>
            <MenuItem icon={<ArrowUp />} disabled={index === 0} onClick={() => (pending.current = "up")}>
              {t("moveUp")}
            </MenuItem>
            <MenuItem icon={<ArrowDown />} disabled={index >= total - 1} onClick={() => (pending.current = "down")}>
              {t("moveDown")}
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={<Trash />} tone="danger" onClick={() => (pending.current = "delete")}>
              {t("delete")}
            </MenuItem>
          </MenuContent>
        </Menu>
      ) : null}
    </li>
  );
}
