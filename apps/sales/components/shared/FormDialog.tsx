"use client";

// A dialog with a form: the library's Dialog, a busy submit button, and the primary action last.
// onSubmit rejects (invalid form, failed request) to keep the dialog open; the form or the request's
// toast says why.
import { isValidElement, useState, type ReactElement, type ReactNode } from "react";
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@orgtik/ui";

export function FormDialog({
  trigger,
  open: controlled,
  onOpenChange,
  title,
  description,
  submitLabel,
  cancelLabel,
  onSubmit,
  onClosed,
  size = "lg",
  children,
}: {
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  submitLabel: ReactNode;
  cancelLabel: ReactNode;
  onSubmit: () => Promise<unknown>;
  /** After it closes, whatever closed it: reset the form here. */
  onClosed?: () => void;
  size?: "sm" | "md" | "lg" | "xl";
  children: ReactNode;
}) {
  const [own, setOwn] = useState(false);
  const [busy, setBusy] = useState(false);
  const open = controlled ?? own;
  const setOpen = (next: boolean) => {
    if (controlled === undefined) setOwn(next);
    onOpenChange?.(next);
    if (!next) onClosed?.();
  };
  const submit = async () => {
    setBusy(true);
    try {
      await onSubmit();
      setOpen(false);
    } catch {
      // stays open
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && isValidElement(trigger) ? <DialogTrigger render={trigger as ReactElement<Record<string, unknown>>} /> : null}
      <DialogContent size={size}>
        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          <DialogBody className="flex flex-col gap-5 text-start">{children}</DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setOpen(false)}>
              {cancelLabel}
            </Button>
            <Button type="submit" variant="primary" loading={busy}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
