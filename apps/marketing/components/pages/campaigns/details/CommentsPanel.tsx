"use client";

// Comments and activity on a campaign, newest first. Dates are in the reader's language and the
// project's zone (they were en-GB dates with en-US times). Activity lines are written by the server.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { Avatar, Button, Card, ListStates, Textarea, useFormatter } from "@orgtik/ui";
import { useAppSelector } from "@/redux/app/hooks";
import { useCreateCampaignCommentMutation, useGetCampaignCommentsQuery } from "@/redux/features/campaigns/campaignsApi";
import { useMarketingRoles } from "@/lib/permissions";
import { useProjectContext } from "@/lib/project-context";
import type { ICampaignComment } from "@/types/campaigns";

const nameOf = (c: ICampaignComment) => c.user?.name || [c.user?.firstName, c.user?.lastName].filter(Boolean).join(" ") || c.user?.email || "";

export function CommentsPanel({ campaignId }: { campaignId: string }) {
  const t = useTranslations("CampaignComments");
  const f = useFormatter();
  const { timeZone } = useProjectContext();
  const { readOnlySession } = useMarketingRoles();
  const me = useAppSelector((s) => s.auth.user as { firstName?: string; lastName?: string; avatar?: string | null } | null);
  const { data, isLoading, isError, refetch } = useGetCampaignCommentsQuery(campaignId);
  const [create, { isLoading: sending }] = useCreateCampaignCommentMutation();
  const [text, setText] = useState("");
  const items = data?.data ?? [];

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    try {
      await create({ campaignId, text: body }).unwrap();
      setText("");
    } catch {
      // baseApi has said why; the text stays.
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-title-sm text-fg">{t("title")}</h2>
      {!readOnlySession ? (
        <form
          className="flex items-start gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <Avatar name={[me?.firstName, me?.lastName].filter(Boolean).join(" ") || "?"} src={me?.avatar} size="sm" decorative />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Textarea
              value={text}
              dir="auto"
              maxRows={6}
              maxLength={2000}
              aria-label={t("write")}
              placeholder={t("placeholder")}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <Button type="submit" variant="secondary" size="sm" startIcon={<PaperPlaneRight className="rtl:-scale-x-100" />} loading={sending} disabled={!text.trim()} className="self-end">
              {t("send")}
            </Button>
          </div>
        </form>
      ) : null}
      <ListStates
        size="compact"
        status={isLoading ? "loading" : isError ? "error" : items.length ? "ready" : "empty"}
        onRetry={() => void refetch()}
        error={{ title: t("errorTitle") }}
        empty={{ title: t("emptyTitle"), description: readOnlySession ? undefined : t("emptyBody") }}
      >
        <ol className="flex flex-col gap-4">
          {items.map((c) => {
            const who = nameOf(c);
            const when = f.date(c.createdAt, { dateStyle: "medium", timeStyle: "short", timeZone });
            return (
              <li key={c.id} className="flex items-start gap-3">
                <Avatar name={who || "?"} src={c.user?.avatar} size="sm" decorative />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="text-body-sm text-fg">
                    <span dir="auto" className="font-semibold">
                      {who}
                    </span>{" "}
                    <span className="text-caption text-fg-muted">
                      <time dateTime={c.createdAt}>{when}</time>
                    </span>
                  </p>
                  {c.type === "activity" ? (
                    <p dir="auto" className="text-body-sm text-fg-muted">
                      {c.text}
                    </p>
                  ) : (
                    <p dir="auto" className="whitespace-pre-wrap rounded-field bg-sunken p-3 text-body-sm text-fg">
                      {c.text}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </ListStates>
    </Card>
  );
}
