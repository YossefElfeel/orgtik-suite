"use client";
// A conversation with OrgTik (a ticket, a service request): who wrote, when, what. OrgTik's people
// show as one name ("OrgTik support"), the workspace's own people by name, the reader as "You".
// The reply box sits under it, with what sending does said next to the button.
import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { Avatar, Button, Field, Textarea, useFormatter } from "@orgtik/ui";
import { cn } from "@orgtik/ui";

export type ThreadMessage = { key: string; author: string; staff: boolean; mine: boolean; at: string; text: string };

export function Thread({ messages, label, empty }: { messages: ThreadMessage[]; label: string; empty: string }) {
  const f = useFormatter();
  const t = useTranslations("Support.thread");
  if (!messages.length) return <p className="text-body-sm text-fg-muted">{empty}</p>;
  return (
    <ol aria-label={label} className="flex flex-col gap-3">
      {messages.map((m) => (
        <li key={m.key} className={cn("flex gap-3 rounded-card border p-4", m.staff ? "border-line bg-sunken" : "border-line bg-raised")}>
          <Avatar name={m.staff ? "OrgTik" : m.author} size="sm" decorative />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="flex flex-wrap items-baseline gap-x-2 text-body-sm">
              <bdi dir="auto" className="font-semibold text-fg">
                {m.mine ? t("you") : m.author}
              </bdi>
              <time dateTime={m.at} className="text-caption text-fg-muted">
                {f.date(m.at, { dateStyle: "medium", timeStyle: "short" })}
              </time>
            </p>
            <p dir="auto" className="whitespace-pre-line break-words text-body text-fg">
              {m.text}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Composer({
  label,
  placeholder,
  submitLabel,
  note,
  onSend,
  error,
}: {
  label: string;
  placeholder?: string;
  submitLabel: string;
  /** What sending does, e.g. "Replying reopens the ticket". */
  note?: ReactNode;
  /** Resolves when sent; rejects with the message to show. */
  onSend: (text: string) => Promise<unknown>;
  error?: string | null;
}) {
  const t = useTranslations("Support.thread");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [missing, setMissing] = useState(false);
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!text.trim()) {
          setMissing(true);
          return;
        }
        setSending(true);
        try {
          await onSend(text.trim());
          setText("");
        } catch {
          // The caller shows the error.
        } finally {
          setSending(false);
        }
      }}
    >
      <Field label={label} error={missing ? t("empty") : (error ?? undefined)} description={note}>
        <Textarea
          value={text}
          placeholder={placeholder}
          rows={3}
          maxRows={10}
          onChange={(e) => {
            setText(e.target.value);
            if (missing) setMissing(false);
          }}
        />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={sending} startIcon={<PaperPlaneRight className="rtl:-scale-x-100" />}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
