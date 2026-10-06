/**
 * Shared form styling to match add-product form and dashboard theme.
 * Use in components/ui/form/* for consistent inputs, labels, selects, etc.
 */
export const formStyles = {
  /** Label above inputs — matches Figma Input Field (node 399:42945) */
  label:
    "block text-base font-medium leading-5 text-fg [text-shadow:0px_1px_2px_rgba(20,28,36,0.04)]",
  /** Text/number/date input — Figma: 40px height, #E0E4EE border, subtle shadow */
  input:
    "h-10 w-full rounded-lg border border-line bg-raised px-3 py-2 text-base font-normal leading-5 text-fg shadow-[0px_1px_2px_0px_rgba(37,40,45,0.1)] outline-none transition-all placeholder:text-fg-muted focus-visible:border-fg-brand focus-visible:ring-2 focus-visible:ring-fg-brand/15 disabled:border-line disabled:bg-muted/40 disabled:text-muted-foreground",
  /** Textarea (add h-32 resize-none etc. in className) */
  textarea:
    "w-full rounded-lg border border-line bg-raised px-3 py-2 text-base font-normal leading-5 text-fg shadow-[0px_1px_2px_0px_rgba(37,40,45,0.1)] outline-none transition-all placeholder:text-fg-muted focus-visible:border-fg-brand focus-visible:ring-2 focus-visible:ring-fg-brand/15 disabled:border-line disabled:bg-muted/40 disabled:text-muted-foreground resize-none",
  /** Select trigger / dropdown */
  select:
    "h-10 w-full rounded-lg border border-line bg-raised px-3 py-2 text-base font-normal leading-5 text-fg shadow-[0px_1px_2px_0px_rgba(37,40,45,0.1)] outline-none transition-all data-placeholder:text-fg-muted focus-visible:border-fg-brand focus-visible:ring-2 focus-visible:ring-fg-brand/15 disabled:border-line disabled:bg-muted/40 disabled:text-muted-foreground",
  /** Radio/checkbox group container */
  groupContainer:
    "grid gap-2",
  /** Radio/checkbox option label */
  optionLabel:
    "cursor-pointer text-sm font-medium leading-[18px] text-foreground",
  /** Checkbox/radio input (native) */
  control:
    "border-input bg-background text-primary focus:ring-primary/20 rounded-md",
  /** Single checkbox row (label + checkbox) */
  checkboxRow: "flex items-center gap-2",
  /** Form item wrapper gap */
  item: "grid gap-1",
  /** Error message */
  message: "mt-1 text-xs font-medium text-destructive",
} as const;
