"use client";

// A list's state in the address (FS-HR-6, HR-023): search, filters, page and page size survive a
// reload and a shared link, and Back works. Defaults stay out of the address; any change other
// than the page itself goes back to page 1.
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useListParams<D extends Record<string, string>>(defaults: D) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const get = <K extends keyof D & string>(key: K): string => params.get(key) ?? defaults[key];
  const page = Math.max(1, Number(params.get("page")) || 1);
  const limit = Number(params.get("limit")) || 10;

  /** Writes keys to the address; a key equal to its default (or empty) is removed. */
  const set = (next: Partial<Record<keyof D | "page" | "limit", string | number | null>>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      const value = v == null ? "" : String(v);
      const fallback = k === "page" ? "1" : k === "limit" ? "10" : defaults[k] ?? "";
      if (value === "" || value === fallback) sp.delete(k);
      else sp.set(k, value);
    }
    if (!("page" in next)) sp.delete("page");
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  return { get, page, limit, set };
}
