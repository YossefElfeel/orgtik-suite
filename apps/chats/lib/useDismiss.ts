"use client";

/**
 * SOMION HQ - DISMISSAL
 *
 * Two small hooks that every overlay shares.
 *
 * useBackToClose: the browser's Back closes the overlay instead of leaving the
 * page. Phones have a hardware or gesture Back, and a dialog that ignores it
 * sends people to the previous page with the dialog still in their head.
 *
 * How it works, and why it works this way:
 *
 *   - Opening an overlay pushes one history entry and records it in a ledger
 *     kept here. The ledger, not `history.state`, is the source of truth: the
 *     app router rewrites the current entry's state after its own renders,
 *     so anything stored there is gone by the time it is needed.
 *   - Every popstate is one step back through the ledger. A live entry closes
 *     its overlay. A dead entry - an overlay that was closed some other way -
 *     steps back again, so one press always does one visible thing.
 *   - Closing an overlay any other way (Escape, its own close, a choice that
 *     navigates) never pops history. Popping raced with whatever the app did
 *     next; a navigation started in the same tick was undone by the router's
 *     restore. The entry is marked dead and left for the ledger to skip.
 *   - The router's own navigations are recorded as markers, so Back from a
 *     later page steps over them correctly.
 *
 * Overlays nest - a modal over a pane, a menu over a modal - and the ledger's
 * order handles that: Back closes the most recent one first.
 *
 * Known limit: the browser's Forward button is not modelled. It is rare inside
 * an app shell, and the worst case is one Back press that does nothing.
 *
 * useEscape: Escape closes, unless something above already handled it.
 */

import { useEffect, useRef } from "react";

interface LedgerEntry {
  kind: "overlay" | "nav";
  id: number;
  dead: boolean;
  close: () => void;
}

let sequence = 0;
const ledger: LedgerEntry[] = [];
let installed = false;

function install(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const push = window.history.pushState.bind(window.history);
  window.history.pushState = function (state, unused, url) {
    const ours = Boolean((state as { hqOverlay?: boolean } | null)?.hqOverlay);
    /* A push that is not ours is the router moving to another page. */
    if (!ours) ledger.push({ kind: "nav", id: ++sequence, dead: false, close: () => undefined });
    return push(state, unused, url);
  } as typeof window.history.pushState;

  window.addEventListener("popstate", () => {
    const top = ledger.pop();
    if (!top || top.kind === "nav") return;
    if (top.dead) {
      /* Its overlay is already gone: this step showed nothing. Keep going. */
      window.history.back();
      return;
    }
    top.close();
  });
}

export function useBackToClose(open: boolean, onClose: () => void): void {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const mine = useRef<LedgerEntry | null>(null);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    install();

    const top = ledger[ledger.length - 1];
    if (mine.current && top === mine.current && top.dead) {
      /* Reopened while our own dead entry is still on top - either the effect
         re-ran in the same task (development does this) or the person opened
         the same thing again without going anywhere. Revive it. */
      top.dead = false;
      top.close = () => closeRef.current();
    } else {
      const entry: LedgerEntry = { kind: "overlay", id: ++sequence, dead: false, close: () => closeRef.current() };
      ledger.push(entry);
      mine.current = entry;
      window.history.pushState({ hqOverlay: true, id: entry.id }, "");
    }

    return () => {
      /* Closed by Back (already popped) or by anything else: either way the
         entry is dead from here on. Nothing touches history. */
      if (mine.current) mine.current.dead = true;
    };
  }, [open]);
}

export function useEscape(active: boolean, onClose: () => void): void {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active]);
}
