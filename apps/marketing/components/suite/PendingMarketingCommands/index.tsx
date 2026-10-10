"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, useSuite } from "@orgtik/ui";
import { useProjectContext } from "@/lib/project-context";
import { useMarketingRoles } from "@/lib/permissions";
import { useAppDispatch } from "@/redux/app/hooks";
import { baseApi } from "@/redux/app/baseApi";
import {
  MARKETING_COMMAND_EVENT,
  pendingMarketingCommands,
  recoverMarketingCommand,
  type MarketingCommand,
} from "@/lib/command-recovery";
export default function PendingMarketingCommands() {
  const t = useTranslations("MarketingV3"),
    project = useProjectContext(),
    can = useMarketingRoles(),
    suite = useSuite(),
    dispatch = useAppDispatch();
  const [commands, setCommands] = useState<MarketingCommand[]>([]),
    [busy, setBusy] = useState<string>(),
    [error, setError] = useState(false);
  const scope = JSON.stringify([
    suite.snapshot?.realm,
    suite.snapshot?.workspace.id,
    suite.snapshot?.actor,
    project.id,
  ]);
  useEffect(() => {
    const update = () => setCommands(pendingMarketingCommands(project.id));
    update();
    window.addEventListener(MARKETING_COMMAND_EVENT, update);
    return () => window.removeEventListener(MARKETING_COMMAND_EVENT, update);
  }, [scope, project.id]);
  if (!commands.length) return null;
  const action = (row: MarketingCommand) =>
    row.path.endsWith("/test")
      ? "testSend"
      : row.path.endsWith("/replies")
        ? "sendReply"
        : row.path.endsWith("/mock-delivery")
          ? "delivery"
          : row.path.endsWith("/run")
            ? "runDry"
            : row.path.endsWith("/lead")
              ? "createLead"
              : row.path === "/tasks"
                ? "createTask"
                : "consent";
  const permitted = (row: MarketingCommand) =>
    row.path.endsWith("/replies")
      ? can.editPosts
      : row.path.endsWith("/test") || row.path === "/crm/consent"
        ? can.manageAudience
        : can.editCampaigns;
  return (
    <section
      aria-label={t("pendingCommands")}
      className="mb-5 flex flex-col gap-3 rounded-card border border-line bg-raised p-4"
    >
      <p className="text-body font-semibold">{t("pendingCommands")}</p>
      <p className="max-w-prose text-body-sm text-fg-muted">
        {t("pendingCommandsBody")}
      </p>
      {commands.map((row) => (
        <div
          key={row.key}
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="min-w-0 text-body-sm">
            {t(action(row))}
            {typeof row.body.title === "string" ||
            typeof row.body.body === "string" ? (
              <span dir="auto">
                {" "}
                · {String(row.body.title || row.body.body).slice(0, 200)}
              </span>
            ) : null}
          </p>
          <Button
            variant="secondary"
            loading={busy === row.key}
            disabled={
              Boolean(busy) ||
              !permitted(row) ||
              !suite.snapshot?.tools.marketing?.canWrite ||
              Boolean(suite.snapshot?.actor.readOnly)
            }
            onClick={async () => {
              setBusy(row.key);
              setError(false);
              try {
                await recoverMarketingCommand(row, project.id);
                dispatch(baseApi.util.resetApiState());
                await suite.refresh?.();
              } catch {
                setError(true);
              } finally {
                setBusy(undefined);
              }
            }}
          >
            {t("recoverCommand")}
          </Button>
        </div>
      ))}
      {error ? (
        <p role="alert" className="text-body-sm text-danger">
          {t("recoveryDenied")}
        </p>
      ) : null}
    </section>
  );
}
