"use client";

import { Link } from "@/i18n/routing";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";

export type MainHeaderProps = {
  title?: string;

  smallTitle?: string;
  description?: string;
  children?: React.ReactNode;
  backLink?: {
    href: string;
    label: string;
  };
  subChildren?: React.ReactNode;
};

const contentMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const },
};

const backLinkMotion = {
  initial: { opacity: 0, height: 0, y: -6 },
  animate: { opacity: 1, height: "auto", y: 0 },
  exit: { opacity: 0, height: 0, y: -6 },
  transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const },
};

function MainHeader({
  title,
  smallTitle,
  description,
  children,
  backLink,
  subChildren,
}: MainHeaderProps) {
  return (
    <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <AnimatePresence initial={false} mode="wait">
          {backLink ? (
            <motion.div
              key={`${backLink.href}-${backLink.label}`}
              {...backLinkMotion}
              className="overflow-hidden"
            >
              <Link
                href={backLink.href}
                className="mb-2 inline-flex w-fit items-center gap-2 text-sm font-medium text-secondary transition-colors hover:text-foreground"
              >
                <Icon icon="solar:arrow-left-linear" className="size-4" />
                {backLink.label}
              </Link>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={`${title}-${description ?? ""}`}
            {...contentMotion}
            className="flex flex-col gap-1"
          >
            {smallTitle ? (
              <h2 className="text-lg font-semibold">{smallTitle}</h2>
            ) : null}
            {title ? <h1 className="text-24 font-semibold">{title}</h1> : null}
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </motion.div>
        </AnimatePresence>

        {subChildren}
      </div>

      <AnimatePresence initial={false} mode="wait">
        {children ? (
          <motion.div
            key={`actions-${title}`}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="shrink-0"
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

export default MainHeader;
