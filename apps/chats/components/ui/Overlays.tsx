"use client";

/**
 * SOMION HQ - MODAL AND MENU
 *
 * Two overlay shapes, and a rule about which to use.
 *
 * A MODAL is for a task that genuinely needs protected focus and a decision
 * before you carry on: creating a channel, renaming a room. Anything that does
 * not need protecting gets a popover, a pane, or nothing at all - a modal for
 * an interruption nobody asked for is the most common way an interface starts
 * feeling hostile.
 *
 * Both trap focus, both close on Escape and on an outside click, and both
 * restore focus to whatever opened them. A dialog you can tab out of is a trap
 * for exactly the people least able to escape it.
 */

import { useBackToClose } from "@/lib/useDismiss";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ConfirmDialog, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@orgtik/ui";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Shared behaviour: trap the tab ring, close on Escape, restore focus. */
function useDismissable(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  useBackToClose(open, onClose);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;

    const node = ref.current;
    const first = node?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) return;
      const firstEl = items[0] as HTMLElement;
      const lastEl = items[items.length - 1] as HTMLElement;
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      restoreTo.current?.focus?.();
    };
  }, [open, onClose]);

  return ref;
}

/* ------------------------------------------------------------------- modal */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 460,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  /* The library's Dialog (Chats wave, FS-CHT-9): focus trapped and restored, Escape and the scrim
     close it, the title names it. HQ's width maps onto the library's sizes. */
  const size = width <= 420 ? "sm" : width <= 520 ? "md" : width <= 720 ? "lg" : "xl";
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent size={size}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <DialogBody>{children}</DialogBody>
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------- menu */

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  danger?: boolean;
  /** Renders a divider above this item. */
  separated?: boolean;
}

/** A dropdown of actions, anchored to whatever opened it. */
export function Menu({
  open,
  onClose,
  items,
  label,
  align = "end",
}: {
  open: boolean;
  onClose: () => void;
  items: MenuItem[];
  label: string;
  align?: "start" | "end";
}) {
  const ref = useDismissable(open, onClose);

  const onDocDown = useCallback(
    (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    },
    [onClose, ref],
  );

  useEffect(() => {
    if (!open) return;
    /* Deferred, so the click that opened this does not immediately close it. */
    const id = setTimeout(() => document.addEventListener("mousedown", onDocDown), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", onDocDown);
    };
  }, [open, onDocDown]);

  /* Near the bottom of a scrolling list a menu that opens downward is cut off
     by the list itself. Measure once on open and open upward if that is where
     the room is. */
  const [flipUp, setFlipUp] = useState(false);
  useLayoutEffect(() => {
    if (!open) {
      setFlipUp(false);
      return;
    }
    const el = ref.current;
    if (!el) return;
    let scroller: HTMLElement | null = el.parentElement;
    while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) {
      scroller = scroller.parentElement;
    }
    const limit = scroller ? scroller.getBoundingClientRect().bottom : window.innerHeight;
    const r = el.getBoundingClientRect();
    setFlipUp(r.bottom > limit - 8 && r.top - r.height > (scroller?.getBoundingClientRect().top ?? 0) + 8);
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={label}
      onKeyDown={(e) => {
        /* Arrow keys, Home and End move through the items (CHT-016). */
        const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'));
        const at = items.indexOf(document.activeElement as HTMLElement);
        const go = (i: number) => {
          e.preventDefault();
          items[(i + items.length) % items.length]?.focus();
        };
        if (e.key === "ArrowDown") go(at + 1);
        else if (e.key === "ArrowUp") go(at - 1);
        else if (e.key === "Home") go(0);
        else if (e.key === "End") go(items.length - 1);
      }}
      className="hq-floating hq-rise absolute z-[60] p-1"
      style={{
        [align === "end" ? "insetInlineEnd" : "insetInlineStart"]: 0,
        ...(flipUp ? { bottom: "calc(100% + 4px)" } : { top: "calc(100% + 4px)" }),
        /* An absolutely positioned menu inside a 29px toolbar shrinks to fit
           that toolbar and wraps every label. It takes its own width. */
        width: "max-content",
        minWidth: 184,
        maxWidth: 300,
        borderRadius: "var(--radius-control)",
      }}
    >
      {items.map((item) => (
        <div key={item.id}>
          {item.separated && (
            <span
              aria-hidden="true"
              className="my-1 block h-px"
              style={{ background: "var(--color-hairline)" }}
            />
          )}
          <button
            role="menuitem"
            onClick={() => {
              item.onSelect();
              onClose();
            }}
            className="hq-row flex w-full items-center gap-2.5 px-2.5 py-1.5 text-start text-[13px]"
            style={{
              borderRadius: "var(--radius-object)",
              color: item.danger ? "var(--color-danger-600)" : "var(--color-ink)",
              minHeight: 32,
            }}
          >
            {item.icon}
            <span className="flex-1 whitespace-nowrap">{item.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- confirm */

/** A destructive confirmation. Names the consequence, not just "are you sure". */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel: string;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={title}
      impact={body}
      confirmLabel={confirmLabel}
      tone="danger"
      onConfirm={() => {
        onConfirm();
        onClose();
      }}
    />
  );
}
