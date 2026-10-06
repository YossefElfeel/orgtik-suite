import type { ReactElement, ReactNode } from "react";

/** A delete, confirmed (FS-HR-6). Name the thing in `title`; say what else it touches in `description`. */
export interface DeleteDialogProps {
  /** A question naming the thing: "Delete the Marketing department?" */
  title?: string;
  /** What happens to other things: "Its 6 people keep their jobs but leave the department." */
  description?: ReactNode;
  /** Runs the delete; return its promise so the dialog waits for it and stays open if it fails. */
  onConfirm: () => unknown | Promise<unknown>;
  /** The button that opens it. */
  trigger?: ReactElement;
  /** The verb and object: "Delete department". */
  confirmText?: string;
  cancelText?: string;
  /** false for a reversible removal (removing someone from a department). */
  isDestructive?: boolean;
  /** Kept for callers; the dialog shows its own busy state. */
  loading?: boolean;
  /** A word the person must type first, for the most destructive deletes. */
  confirmationText?: string;
  confirmationLabel?: string;
  /** More about the impact, under the description. */
  children?: ReactNode;
  className?: string;
}
