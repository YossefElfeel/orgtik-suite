/**
 * Shared form styling to match add-product form and dashboard theme.
 * Use in components/ui/form/* for consistent inputs, labels, selects, etc.
 */
export const formStyles = {
  label:
    "block text-[14px] font-semibold uppercase tracking-wide text-foreground",
  input:
    "h-10 w-full rounded-lg border border-border  px-3 text-[14px] font-normal text-secondary outline-none transition-all placeholder:text-secondary/80 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:border-border disabled:bg-muted/40 disabled:text-muted-foreground",
  textarea:
    "w-full rounded-lg border border-border  px-3 py-2 text-[14px] text-secondary outline-none transition-all placeholder:text-secondary/80 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:border-border disabled:bg-muted/40 disabled:text-muted-foreground",
  select:
    "h-10 w-full rounded-lg border border-border  px-3 text-[14px] font-normal text-secondary shadow-none outline-none transition-all data-placeholder:text-secondary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:border-border disabled:bg-muted/40 disabled:text-muted-foreground",
  groupContainer: "grid gap-2",
  optionLabel:
    "cursor-pointer text-14 font-medium leading-tight text-secondary",
  control: "border-input bg-background text-primary focus:ring-primary/20 ",
  checkboxRow: "flex items-center gap-1.5",
  item: "grid gap-1 rounded-xl transition-shadow data-[invalid=true]:p-2 data-[invalid=true]:-m-2",
  message: "mt-1 text-xs font-medium text-destructive",
  optional: "ms-1 font-semibold text-gray-400",
  required: "ms-0.5 text-destructive",
} as const;
