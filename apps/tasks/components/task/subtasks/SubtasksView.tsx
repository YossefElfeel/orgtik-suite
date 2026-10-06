"use client";
import { useCallback, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type Modifier,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ListChecks, Plus } from "@phosphor-icons/react";
import { Button, ConfirmDialog, EmptyState, ErrorState, Input, LoadingState, Progress, cn } from "@orgtik/ui";
import { isolate } from "@/lib/bidi";
import type { ISetupItem } from "@/types/tasks";
import type { SubtasksModel } from "./useSubtasks";
import { SubtaskRow, type SubtaskSize } from "./SubtaskRow";

// A key code no keyboard sends: how Escape cancels a keyboard drag without also closing the sheet
// or dialog around the list (they close on Escape and stop it from reaching dnd-kit).
const CANCEL_CODE = "OrgtikDragCancel";

/**
 * The subtasks: progress, the list, the add field. The panel shows it compact; the larger dialog
 * shows the same component at `size="large"`.
 */
export function SubtasksView({
  model,
  readOnly,
  size,
  headerEnd,
}: {
  model: SubtasksModel;
  readOnly: boolean;
  size: SubtaskSize;
  /** Something at the end of the progress line, e.g. the "larger view" button. */
  headerEnd?: ReactNode;
}) {
  const t = useTranslations("TaskSubtasks");
  const { items, done, total } = model;
  const [deleting, setDeleting] = useState<ISetupItem | null>(null);
  const [message, setMessage] = useState("");

  const announce = useCallback((text: string) => {
    // Clear first so the same sentence twice is read twice.
    setMessage("");
    requestAnimationFrame(() => setMessage(text));
  }, []);

  if (model.isLoading) {
    return <LoadingState rows={3} label={t("loading")} />;
  }
  if (model.isError) {
    return <ErrorState size="compact" title={t("errorTitle")} onRetry={() => void model.refetch()} />;
  }

  const large = size === "large";

  return (
    <div className={cn("flex flex-col", large ? "gap-4" : "gap-3")}>
      {total > 0 ? (
        <div className="flex items-end gap-2">
          <Progress
            value={total ? Math.round((done / total) * 100) : 0}
            label={t("summary", { done, total })}
            className="min-w-0 flex-1"
          />
          {headerEnd}
        </div>
      ) : (
        <EmptyState
          size="compact"
          icon={<ListChecks />}
          title={t("emptyTitle")}
          description={readOnly ? t("emptyBodyReadOnly") : t("emptyBody")}
        />
      )}

      {total > 0 ? (
        <SortableList
          items={items}
          readOnly={readOnly}
          size={size}
          onToggle={(s, checked) => void model.toggle(s.id, checked)}
          onRename={(s, title) => model.rename(s.id, title)}
          onMove={async (s, from, to, via) => {
            // Drags are announced by dnd-kit; menu moves through this list's live region.
            const moved = await model.move(from, to);
            if (moved && via === "menu") announce(t("moved", { title: isolate(s.title), position: to + 1, total }));
          }}
          onDelete={setDeleting}
        />
      ) : null}

      {readOnly ? null : <AddField model={model} size={size} announce={announce} />}

      <div role="status" aria-live="polite" className="sr-only">
        {message}
      </div>

      {readOnly ? null : (
        <ConfirmDialog
          open={deleting !== null}
          onOpenChange={(open) => {
            if (!open) setDeleting(null);
          }}
          title={t("deleteTitle", { title: isolate(deleting?.title) })}
          impact={t("deleteImpact")}
          irreversible
          confirmLabel={t("deleteConfirm")}
          cancelLabel={t("keep")}
          onConfirm={() => (deleting ? model.remove(deleting.id) : undefined)}
        />
      )}
    </div>
  );
}

const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });

function SortableList({
  items,
  readOnly,
  size,
  onToggle,
  onRename,
  onMove,
  onDelete,
}: {
  items: ISetupItem[];
  readOnly: boolean;
  size: SubtaskSize;
  onToggle: (s: ISetupItem, checked: boolean) => void;
  onRename: (s: ISetupItem, title: string) => Promise<boolean>;
  onMove: (s: ISetupItem, from: number, to: number, via: "menu" | "drag") => void;
  onDelete: (s: ISetupItem) => void;
}) {
  const t = useTranslations("TaskSubtasks");
  const dragging = useRef(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ["Space", "Enter"], cancel: ["Escape", CANCEL_CODE], end: ["Space", "Enter", "Tab"] },
    })
  );

  const total = items.length;
  const indexOf = useCallback((id: UniqueIdentifier) => items.findIndex((s) => s.id === id), [items]);
  const titleOf = useCallback((id: UniqueIdentifier) => isolate(items.find((s) => s.id === id)?.title), [items]);

  const announcements = useMemo<Announcements>(
    () => ({
      onDragStart: ({ active }) =>
        t("dragStart", { title: titleOf(active.id), position: indexOf(active.id) + 1, total }),
      onDragOver: ({ active, over }) =>
        over
          ? t("dragOver", { title: titleOf(active.id), position: indexOf(over.id) + 1, total })
          : t("dragOutside", { title: titleOf(active.id) }),
      onDragEnd: ({ active, over }) =>
        over
          ? t("dragEnd", { title: titleOf(active.id), position: indexOf(over.id) + 1, total })
          : t("dragCancel", { title: titleOf(active.id), position: indexOf(active.id) + 1, total }),
      onDragCancel: ({ active }) =>
        t("dragCancel", { title: titleOf(active.id), position: indexOf(active.id) + 1, total }),
    }),
    [indexOf, t, titleOf, total]
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    dragging.current = false;
    if (!over || active.id === over.id) return;
    const from = indexOf(active.id);
    const to = indexOf(over.id);
    const subtask = items[from];
    // dnd-kit has already said where it landed, so no second announcement.
    if (subtask && to >= 0) onMove(subtask, from, to, "drag");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (!dragging.current || e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.ownerDocument.dispatchEvent(new KeyboardEvent("keydown", { code: CANCEL_CODE, key: CANCEL_CODE }));
  };

  const list = (
    <ul aria-label={t("listLabel")} onKeyDown={onKeyDown} className={cn("flex flex-col", size === "large" ? "gap-2" : "gap-1.5")}>
      {items.map((s, i) => (
        <SubtaskRow
          key={s.id}
          subtask={s}
          index={i}
          total={total}
          readOnly={readOnly}
          size={size}
          onToggle={onToggle}
          onRename={onRename}
          onMove={(subtask, from, to) => onMove(subtask, from, to, "menu")}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );

  if (readOnly) {
    return (
      <DndContext>
        <SortableContext items={items} strategy={verticalListSortingStrategy} disabled>
          {list}
        </SortableContext>
      </DndContext>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[verticalOnly]}
      accessibility={{ announcements, screenReaderInstructions: { draggable: t("dragInstructions") } }}
      onDragStart={() => {
        dragging.current = true;
      }}
      onDragCancel={() => {
        dragging.current = false;
      }}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {list}
      </SortableContext>
    </DndContext>
  );
}

function AddField({
  model,
  size,
  announce,
}: {
  model: SubtasksModel;
  size: SubtaskSize;
  announce: (text: string) => void;
}) {
  const t = useTranslations("TaskSubtasks");
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    const value = title.trim();
    if (!value || model.isAdding) return;
    if (await model.add(value)) {
      setTitle("");
      announce(t("added", { title: isolate(value) }));
    }
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void submit();
    } else if (e.key === "Escape" && title) {
      // Esc clears what was typed; with nothing typed it's left to close the sheet as usual.
      e.preventDefault();
      e.stopPropagation();
      setTitle("");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={inputRef}
        dir="auto"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={t("addPlaceholder")}
        aria-label={t("addLabel")}
        maxLength={255}
        size={size === "large" ? "md" : "sm"}
        className="min-w-0 flex-1"
      />
      <Button
        variant="secondary"
        size={size === "large" ? "md" : "sm"}
        startIcon={<Plus />}
        onClick={() => void submit()}
        loading={model.isAdding}
        disabled={!title.trim()}
      >
        {t("add")}
      </Button>
    </div>
  );
}
