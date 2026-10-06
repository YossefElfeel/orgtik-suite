import type { ReactNode } from "react";

export type PillTabMatch = "exact" | "prefix";

export type PillTabItem = {
  id: string;
  label: string;
  /** Iconify icon name, e.g. `solar:info-circle-linear` */
  icon?: string;
  /** Optional count badge shown next to the label */
  count?: number;
  /** When set, the tab renders as a Next.js locale `Link` */
  href?: string;
  /**
   * Path matching strategy when `value` is not controlled and `href` is set.
   * - `prefix` (default): active when pathname equals href or starts with `href/`
   * - `exact`: active only when pathname equals href
   */
  match?: PillTabMatch;
  disabled?: boolean;
};

export type PillTabsSize = "xs" | "sm" | "md";

export type PillTabsVariant = "primary" | "surface";

export type PillTabsActiveTooltip = {
  tabId: string;
  content: ReactNode;
};

export type PillTabsProps = {
  items: readonly PillTabItem[];
  /** Controlled active tab id. When omitted, derives from pathname for link tabs. */
  value?: string;
  /** Uncontrolled initial active tab id (button mode without pathname). */
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  /** Render tabs as non-interactive (e.g. form step indicators). */
  readOnly?: boolean;
  /** Visual style for active/inactive tabs. Default `primary`. */
  variant?: PillTabsVariant;
  size?: PillTabsSize;
  /** Stretch tabs and track evenly on `lg+`. When `false`, the track shrinks to content. Default `true`. */
  equalWidth?: boolean;
  ariaLabel?: string;
  className?: string;
  navClassName?: string;
  listClassName?: string;
  itemClassName?: string;
  /** Shows a controlled tooltip on the matching tab (e.g. step validation feedback). */
  activeTooltip?: PillTabsActiveTooltip | null;
  onActiveTooltipOpenChange?: (open: boolean) => void;
};
