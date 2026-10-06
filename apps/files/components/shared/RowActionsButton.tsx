"use client";

import { forwardRef, type ComponentProps } from "react";
import { useTranslations } from "next-intl";
import { DotsThreeVertical } from "@phosphor-icons/react";
import { IconButton } from "@orgtik/ui";

/**
 * The "more actions" button on a file or folder, named for what it opens ("Actions for
 * Invoices.pdf"): FILES-005 found 91 of these with no name. Pass it as a menu's trigger; the menu
 * gives it its ref and handlers.
 */
export const RowActionsButton = forwardRef<HTMLButtonElement, { name: string } & Omit<ComponentProps<typeof IconButton>, "label" | "icon">>(function RowActionsButton({ name, ...props }, ref) {
  const t = useTranslations("Files");
  return <IconButton ref={ref} size="sm" variant="ghost" {...props} label={t("rowActions", { name })} icon={<DotsThreeVertical weight="bold" />} />;
});
