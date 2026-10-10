import type { ComponentProps, ReactNode } from "react";
import type { Button } from "@orgtik/ui";

/** A button that shows only an icon (FS-HR-4, HR-016). */
export type IconButtonProps = Omit<ComponentProps<typeof Button>, "aria-label" | "children"> & {
  /** What the button does: its accessible name and its tooltip. Required, since an icon has no name. */
  label: string;
  /** The icon (left out when the button is a trigger's `render` target: the trigger passes it). */
  children?: ReactNode;
  /** Show the label as a tooltip on hover and focus (default true). */
  tooltip?: boolean;
  /**
   * Makes it a link that looks like the button: an app path ("/tickets/1") goes through the
   * locale-aware Link; tel:, mailto: and file URLs are a plain <a>.
   */
  href?: string;
  /** For a file link: the name to save it as. */
  download?: string;
  target?: string;
  rel?: string;
};
