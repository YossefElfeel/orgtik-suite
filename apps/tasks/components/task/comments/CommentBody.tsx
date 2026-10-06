"use client";

// A comment's text. A mention is the person's name and goes nowhere (there is no profile route
// to send it to, TASKS-041); a URL is a real external link, http(s) or mailto only.
import { useTranslations } from "next-intl";
import type { IProjectMember } from "@/types/projects";
import { fullName, parseComment } from "./text";

export function CommentBody({ content, members }: { content: string; members: IProjectMember[] }) {
  const t = useTranslations("TaskComments");
  const pieces = parseComment(content);
  if (!pieces.length) return null;

  return (
    <p dir="auto" className="whitespace-pre-wrap break-words text-body-sm text-fg">
      {pieces.map((p, i) => {
        if (p.kind === "text") return p.value;
        if (p.kind === "mention") {
          const m = members.find((x) => x.id === p.id);
          const name = m ? fullName(m) : t("formerMember");
          return (
            <span key={i} dir="auto" className="rounded-sm bg-brand-subtle px-1 font-semibold text-fg-brand">
              @{name}
            </span>
          );
        }
        return (
          <a
            key={i}
            href={p.href}
            target="_blank"
            rel="noreferrer noopener"
            dir="ltr"
            className="break-all text-fg-brand underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-focus"
          >
            {p.label}
          </a>
        );
      })}
    </p>
  );
}
