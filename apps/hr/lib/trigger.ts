import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { Button } from "@orgtik/ui";
import { IconButton } from "@/components/shared/IconButton";
import { Button as SuiteButton, IconButton as SuiteIconButton } from "@orgtik/ui";

/**
 * Props for a Base UI trigger (dialog, sheet, menu) whose opener the caller passes in
 * (HR wave, FS-HR-4, HR-015). When the opener is a button, it becomes the trigger itself:
 * one button, not a button inside a button (a hydration error) or inside a `role=button`
 * span (nested controls a screen reader can't use). Anything else (a tooltip-wrapped button,
 * a card) keeps the span wrapper, so every caller still opens its overlay.
 */
export function triggerProps(opener: ReactNode): {
  render: ReactElement<Record<string, unknown>>;
  nativeButton: boolean;
  children?: ReactNode;
} {
  if (isValidElement<Record<string, unknown>>(opener) && (opener.type === "button" || opener.type === Button || opener.type === IconButton || opener.type === SuiteButton || opener.type === SuiteIconButton)) {
    return { render: opener, nativeButton: true };
  }
  return { render: createElement("span"), nativeButton: false, children: opener };
}
