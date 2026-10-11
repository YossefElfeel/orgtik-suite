"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CaretDown } from "@phosphor-icons/react";
import { Button, Menu, MenuContent, MenuGroup, MenuTrigger } from "@orgtik/ui";

/** A visible, consistently sized entry point for every dashboard row menu. */
export function RowActionsMenu({
  target,
  children,
}: {
  target?: string;
  children: ReactNode;
}) {
  const t = useTranslations("Improvements");
  return (
    <span className="inline-flex" onClick={(event) => event.stopPropagation()}>
      <Menu>
        <MenuTrigger
          render={
            <Button
              variant="secondary"
              size="sm"
              shape="control"
              aria-label={target ? `${t("actions")}: ${target}` : t("actions")}
              className="group min-w-28 border-line-control bg-brand-subtle text-fg-brand hover:border-focus data-[popup-open]:border-action-primary data-[popup-open]:bg-action-primary data-[popup-open]:text-on-action-primary"
              endIcon={
                <CaretDown
                  aria-hidden
                  className="size-4 transition-transform group-data-[popup-open]:rotate-180 motion-reduce:transition-none"
                />
              }
            >
              {t("actions")}
            </Button>
          }
        />
        <MenuContent align="end" className="min-w-52">
          <MenuGroup
            label={
              target ? (
                <span dir="auto" className="block max-w-72 truncate text-fg">
                  {target}
                </span>
              ) : undefined
            }
          >
            {children}
          </MenuGroup>
        </MenuContent>
      </Menu>
    </span>
  );
}
