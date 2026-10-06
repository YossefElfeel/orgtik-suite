// The sign-in shell's content column, shared by sign-in, forgot, reset and invite (FS-SOS-7): one
// heading, one line under it, and one message slot that is announced (the old pages' error boxes
// weren't, and each page had its own card, palette and icon set).
import type { ReactNode } from "react";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react/dist/ssr";

export function AuthPanel({
  title,
  subtitle,
  error,
  success,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  error?: ReactNode;
  success?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="font-display text-title-lg text-fg">{title}</h1>
        {subtitle ? <p className="text-body text-fg-muted">{subtitle}</p> : null}
      </div>
      {error ? (
        <p role="alert" className="mb-5 flex items-start gap-2 rounded-field bg-danger-subtle px-3 py-2.5 text-body-sm text-danger">
          <WarningCircle aria-hidden="true" weight="fill" className="mt-[0.15em] size-[1.1em] shrink-0" />
          {error}
        </p>
      ) : null}
      {success ? (
        <p role="status" className="mb-5 flex items-start gap-2 rounded-field bg-success-subtle px-3 py-2.5 text-body-sm text-success">
          <CheckCircle aria-hidden="true" weight="fill" className="mt-[0.15em] size-[1.1em] shrink-0" />
          {success}
        </p>
      ) : null}
      {children}
    </div>
  );
}
