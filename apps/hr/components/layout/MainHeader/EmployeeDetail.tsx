"use client";
import { ArrowLeft, Envelope as Mail } from "@phosphor-icons/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";
import { useRouter } from "@/i18n/routing";
export type MainHeaderEmployeeDetail = {
  avatarUrl: string | null;
  avatarAlt: string;
  initials: string;
  statusLabel: string;
  lastClockedInLabel: string;
  lastClockedInValue: string;
  lastMessagedLabel: string;
  lastMessagedValue: string;
  employeeIdLabel: string;
  employeeIdValue: string;
  workEmail: string;
  sendEmailLabel: string;
};

type Props = {
  title: React.ReactNode;
  titleChildren?: React.ReactNode;
  backBtnurl: string;
  backAriaLabel: string;
  employeeDetail: MainHeaderEmployeeDetail;
  children?: React.ReactNode;
};

function EmployeeDetail(props: Props) {
  const router = useRouter();

  const {
    title,
    titleChildren,
    backBtnurl,
    backAriaLabel,
    employeeDetail: d,
  } = props;
  return (
    <section className="bg-gray main-padding border-b border-line">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4 lg:max-w-[min(100%,420px)] lg:shrink-0">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-10 shrink-0 rounded-full border-line bg-raised shadow-[0px_1px_2px_0px_rgba(9,25,72,0.06)]"
            onClick={() => router.push(backBtnurl)}
            aria-label={backAriaLabel}
          >
            <ArrowLeft className="size-[18px] text-fg-muted rtl:-scale-x-100" />
          </Button>

          <Avatar
            size="lg"
            className="size-12 shrink-0 border border-raised shadow-[0px_1px_2px_0px_rgba(9,25,72,0.08)] sm:size-14"
          >
            {d.avatarUrl ? (
              <AvatarImage src={d.avatarUrl} alt={d.avatarAlt} />
            ) : null}
            <AvatarFallback className="text-base font-medium">
              {d.initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold leading-7 text-fg sm:text-2xl sm:leading-8">
                {title}
              </h1>
              {titleChildren}
            </div>
            <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-success-subtle px-2 py-0.5">
              <span
                className="size-1.5 shrink-0 rounded-full bg-success-solid"
                aria-hidden
              />
              <span className="text-xs font-medium leading-4 text-success">
                {d.statusLabel}
              </span>
            </div>
          </div>
        </div>

        <div
          className="hidden h-12 w-px shrink-0 bg-line lg:block"
          aria-hidden
        />

        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-8 xl:gap-12">
          <HeaderMetric
            label={d.lastClockedInLabel}
            value={d.lastClockedInValue}
          />
          <HeaderMetric
            label={d.lastMessagedLabel}
            value={d.lastMessagedValue}
          />
          <HeaderMetric
            label={d.employeeIdLabel}
            value={d.employeeIdValue}
            isolate
          />
        </div>

        <div
          className="hidden h-12 w-px shrink-0 bg-line lg:block"
          aria-hidden
        />

        <div className="flex shrink-0 flex-col gap-2 lg:flex-row lg:items-center lg:ps-2">
          <a
            href={`mailto:${d.workEmail}`}
            className={cn(
              "inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium lg:w-auto",
              "bg-action-primary text-on-action-primary shadow-xs hover:bg-action-primary-hover transition-all active:scale-[0.98]",
            )}
          >
            <Mail className="size-4 shrink-0" aria-hidden />
            {d.sendEmailLabel}
          </a>
          {props.children}
        </div>
      </div>
    </section>
  );
}

export default EmployeeDetail;

function HeaderMetric({
  label,
  value,
  className,
  isolate = false,
}: {
  label: string;
  value: string;
  className?: string;
  /** The value is user data (an employee code): isolate it from the page direction. */
  isolate?: boolean;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-xs font-normal leading-[18px] text-fg-muted">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold leading-5 text-fg">
        {isolate ? <bdi>{value}</bdi> : value}
      </p>
    </div>
  );
}
