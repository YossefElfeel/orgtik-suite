"use client";
import { useCallback, useMemo } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { useAppDispatch } from "@/redux/app/hooks";
import {
  taskApi,
  useCreateSubtaskMutation,
  useDeleteSubtaskMutation,
  useGetSubtasksQuery,
  useReorderSubtasksMutation,
  useUpdateSubtaskMutation,
} from "@/redux/features/task/taskApi";
import type { SuccessResponse } from "@/types";
import type { ISetupItem } from "@/types/tasks";

const NONE: ISetupItem[] = [];

/**
 * One task's subtasks and what can be done to them. The inline panel and the larger dialog both
 * read this, so there is one copy of the logic.
 *
 * Toggle, rename and reorder change the cached list first and put it back if the server refuses
 * (the error toast comes from the api-feedback registry). Add and delete wait for the server.
 */
export function useSubtasks(taskId: number) {
  const dispatch = useAppDispatch();
  const query = useGetSubtasksQuery(taskId, { skip: !taskId });
  const [createSubtask, { isLoading: isAdding }] = useCreateSubtaskMutation();
  const [updateSubtask] = useUpdateSubtaskMutation();
  const [deleteSubtask] = useDeleteSubtaskMutation();
  const [reorderSubtasks] = useReorderSubtasksMutation();

  const items = useMemo(() => {
    const list = query.data?.data;
    if (!list) return NONE;
    return [...list].sort((a, b) => a.order - b.order);
  }, [query.data]);

  const done = useMemo(() => items.filter((s) => s.isCompleted).length, [items]);

  const patch = useCallback(
    (recipe: (draft: SuccessResponse<ISetupItem[]>) => void) =>
      dispatch(
        taskApi.util.updateQueryData("getSubtasks", taskId, (draft) => {
          if (draft?.data) recipe(draft);
        })
      ),
    [dispatch, taskId]
  );

  const toggle = useCallback(
    async (id: number, isCompleted: boolean) => {
      const undo = patch((d) => {
        const s = d.data.find((x) => x.id === id);
        if (s) s.isCompleted = isCompleted;
      });
      try {
        await updateSubtask({ subTaskId: id, subTask: { isCompleted } }).unwrap();
      } catch {
        undo.undo();
      }
    },
    [patch, updateSubtask]
  );

  /** Resolves true when the server took the new title. */
  const rename = useCallback(
    async (id: number, title: string) => {
      const undo = patch((d) => {
        const s = d.data.find((x) => x.id === id);
        if (s) s.title = title;
      });
      try {
        await updateSubtask({ subTaskId: id, subTask: { title } }).unwrap();
        return true;
      } catch {
        undo.undo();
        return false;
      }
    },
    [patch, updateSubtask]
  );

  /** Moves the subtask at `from` to `to` (indexes in the ordered list). */
  const move = useCallback(
    async (from: number, to: number) => {
      if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return false;
      const next = arrayMove(items, from, to).map((s, i) => ({ ...s, order: i + 1 }));
      const undo = patch((d) => {
        d.data = next;
      });
      try {
        await reorderSubtasks({ taskId, subtasks: next.map((s) => ({ id: s.id, order: s.order })) }).unwrap();
        return true;
      } catch {
        undo.undo();
        return false;
      }
    },
    [items, patch, reorderSubtasks, taskId]
  );

  /** Resolves true when the subtask was created. */
  const add = useCallback(
    async (title: string) => {
      try {
        await createSubtask({ taskId, subTask: { title, order: items.length + 1 } }).unwrap();
        return true;
      } catch {
        return false;
      }
    },
    [createSubtask, items.length, taskId]
  );

  /** Rejects on failure, so a ConfirmDialog stays open and says so. */
  const remove = useCallback((id: number) => deleteSubtask(id).unwrap(), [deleteSubtask]);

  return {
    items,
    done,
    total: items.length,
    isLoading: query.isLoading,
    isError: query.isError && !query.data,
    refetch: query.refetch,
    isAdding,
    toggle,
    rename,
    move,
    add,
    remove,
  };
}

export type SubtasksModel = ReturnType<typeof useSubtasks>;
