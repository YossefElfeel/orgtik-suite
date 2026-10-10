"use client";
import { useRef } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  SimulatedTag,
  Textarea,
} from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import {
  useMarketingChangeMutation,
  useSocialThreadsQuery,
} from "@/redux/features/marketing-v3/marketingApi";
import { replySchema } from "@/schemas/marketing-v3";
import { useMarketingRoles } from "@/lib/permissions";
import { useProjectContext } from "@/lib/project-context";
import MarketingProjectFrame from "@/components/shared/MarketingProjectFrame";
export default function SocialInbox() {
  const t = useTranslations("MarketingV3"),
    f = useFormatter(),
    project = useProjectContext(),
    can = useMarketingRoles(),
    query = useSocialThreadsQuery(),
    [change, state] = useMarketingChangeMutation(),
    operation = useRef<string | undefined>(undefined),
    form = useForm<{ body: string }>({
      resolver: zodResolver(replySchema(t)),
      defaultValues: { body: "" },
    });
  return (
    <MarketingProjectFrame title={t("inbox")}>
      <div className="flex items-start gap-3">
        <SimulatedTag />
        <p className="max-w-prose text-body-sm text-fg-muted">
          {t("providerDeferred")}
        </p>
      </div>
      {query.isError ? (
        <ErrorState
          title={t("loadError")}
          onRetry={() => void query.refetch()}
        />
      ) : query.isLoading ? (
        <LoadingState rows={5} />
      ) : !query.data?.length ? (
        <EmptyState
          title={t("empty")}
          action={
            can.manageProjects ? (
              <Button
                loading={state.isLoading}
                onClick={() =>
                  void change({
                    path: "/v3/social-inbox/sample",
                    method: "POST",
                    body: {},
                  })
                }
              >
                {t("loadSample")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {query.data.map((thread) => (
            <article
              key={thread.id}
              className="rounded-card border border-line bg-raised p-5"
            >
              <h2 dir="auto" className="font-display text-title-sm">
                {thread.subject}
              </h2>
              <p dir="auto" className="mt-2 text-body-sm text-fg-muted">
                {thread.senderName}
              </p>
              <ol className="my-5 divide-y divide-line">
                {[
                  ...thread.incoming.map((message) => ({
                    ...message,
                    actorName: thread.senderName,
                  })),
                  ...thread.replies,
                ].map((message) => (
                  <li key={message.id} className="py-4">
                    <p dir="auto" className="text-body">
                      {message.body}
                    </p>
                    <p className="mt-2 text-caption text-fg-muted">
                      <span dir="auto">{message.actorName}</span> ·{" "}
                      {f.dateTime(new Date(message.at), {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: project.timeZone,
                      })}
                    </p>
                  </li>
                ))}
              </ol>
              {can.editPosts ? (
                <form
                  className="flex max-w-3xl flex-col gap-3"
                  onSubmit={form.handleSubmit(async (body) => {
                    try {
                      operation.current ||= crypto.randomUUID();
                      await change({
                        path: `/v3/social-inbox/${encodeURIComponent(thread.id)}/replies`,
                        method: "POST",
                        body: { ...body, operationId: operation.current },
                      }).unwrap();
                      operation.current = undefined;
                      form.reset();
                    } catch {}
                  })}
                >
                  <RHFField
                    control={form.control}
                    name="body"
                    label={t("reply")}
                    required
                    render={(field) => (
                      <Textarea
                        {...field}
                        rows={3}
                        dir="auto"
                        disabled={state.isLoading}
                      />
                    )}
                  />
                  <Button
                    type="submit"
                    className="self-start"
                    loading={state.isLoading}
                  >
                    {t("sendReply")}
                  </Button>
                </form>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </MarketingProjectFrame>
  );
}
