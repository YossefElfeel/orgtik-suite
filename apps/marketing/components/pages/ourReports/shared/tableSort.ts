"use client";

// A table's sort in the URL (?sort=followers&dir=asc), so the order survives a reload and the
// export follows what is on screen.
import type { SortingState, Updater } from "@tanstack/react-table";
import { useSearchState } from "./period";

export function useUrlSort<K extends string>(allowed: readonly K[], fallback: K, fallbackDir: "asc" | "desc" = "desc") {
  const { params, set } = useSearchState();
  const raw = params.get("sort") as K | null;
  const id: K = raw && allowed.includes(raw) ? raw : fallback;
  const dir: "asc" | "desc" = params.get("dir") === "asc" ? "asc" : params.get("dir") === "desc" ? "desc" : raw ? "desc" : fallbackDir;
  const sorting: SortingState = [{ id, desc: dir === "desc" }];
  const setSort = (nextId: K, nextDir: "asc" | "desc") => set({ sort: nextId === fallback && nextDir === fallbackDir ? null : nextId, dir: nextId === fallback && nextDir === fallbackDir ? null : nextDir });
  const onSortingChange = (u: Updater<SortingState>) => {
    const next = typeof u === "function" ? u(sorting) : u;
    const first = next[0];
    if (!first || !allowed.includes(first.id as K)) return setSort(fallback, fallbackDir);
    setSort(first.id as K, first.desc ? "desc" : "asc");
  };
  return { id, dir, sorting, onSortingChange, setSort };
}

/** Sorts rows the way the table shows them, for the export. */
export function sortRows<T>(rows: T[], value: (row: T) => string | number, dir: "asc" | "desc") {
  const k = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = value(a);
    const y = value(b);
    return typeof x === "number" && typeof y === "number" ? k * (x - y) : k * String(x).localeCompare(String(y));
  });
}
