import { readClientSession, refreshClientSession } from "@orgtik/ui/auth";
import { API_URL } from "@/constants";
import { SOS_API_URL } from "@/constants/env";
import { marketingRequestScope } from "./request-scope";

type Body = Record<string, unknown> & { operationId: string };
export type MarketingCommand = {
  key: string;
  scope: string;
  projectId: string;
  kind: "native" | "suite";
  path: string;
  method: "POST";
  body: Body;
  uncertain: boolean;
};
const PREFIX = "orgtik.marketing-command.v1:";
export const MARKETING_COMMAND_EVENT = "orgtik-marketing-command";
const allowed = (kind: MarketingCommand["kind"], path: string) =>
  kind === "native"
    ? /^\/v3\/(senders\/[^/]+\/test|social-inbox\/[^/]+\/replies|campaigns\/[^/]+\/mock-delivery|journeys\/[^/]+\/run)$/.test(
        path,
      )
    : /^\/(crm\/consent|marketing\/campaigns\/[^/]+\/lead|tasks)$/.test(path);
const apiRoot = () => (API_URL || "").replace(/\/+$/, "").replace(/\/api$/, "");
const currentScope = () => {
  const session = readClientSession(),
    context = session?.workspaceContext;
  let issuer = "";
  try {
    if (session)
      issuer = String(
        JSON.parse(
          atob(
            session.tokens.accessToken
              .split(".")[1]
              .replaceAll("-", "+")
              .replaceAll("_", "/"),
          ),
        ).iss || "",
      );
  } catch {}
  return context && session && apiRoot()
    ? JSON.stringify([
        apiRoot(),
        issuer,
        context.realm,
        context.workspace.id,
        session.user.id,
        context.actor.userId,
        context.actor.effectiveUserId,
      ])
    : "";
};
const announce = () => window.dispatchEvent(new Event(MARKETING_COMMAND_EVENT));
const payload = (body: Body) =>
  JSON.stringify(
    Object.fromEntries(
      Object.entries(body)
        .filter(([key]) => key !== "operationId")
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
  );
export class MarketingRecoveryRequired extends Error {}
export function prepareMarketingCommand(
  kind: MarketingCommand["kind"],
  projectId: string | null,
  path: string,
  body: unknown,
): MarketingCommand | undefined {
  if (
    !allowed(kind, path) ||
    !body ||
    typeof body !== "object" ||
    !("operationId" in body) ||
    typeof body.operationId !== "string"
  )
    return;
  const scope = currentScope();
  if (!scope || !projectId)
    throw new MarketingRecoveryRequired("command_scope_unavailable");
  const source =
    path === "/crm/consent"
      ? (body as Body).contactId
      : path === "/tasks"
        ? [
            (body as Body).sourceId,
            (body as Body).journeyId,
            (body as Body).stepId,
          ]
        : null;
  const key = PREFIX + JSON.stringify([scope, projectId, kind, path, source]);
  const stored = sessionStorage.getItem(key);
  if (stored) {
    const original = JSON.parse(stored) as MarketingCommand;
    if (payload(original.body) !== payload(body as Body))
      throw new MarketingRecoveryRequired("recover_original_first");
    return original;
  }
  const command: MarketingCommand = {
    key,
    scope,
    projectId,
    kind,
    path,
    method: "POST",
    body: body as Body,
    uncertain: false,
  };
  if (JSON.stringify(command).length > 16000)
    throw new MarketingRecoveryRequired("command_too_large");
  sessionStorage.setItem(key, JSON.stringify(command));
  announce();
  return command;
}
export function settleMarketingCommand(
  command: MarketingCommand | undefined,
  status?: number | string,
) {
  if (!command) return;
  const stored = sessionStorage.getItem(command.key);
  if (!stored) return;
  const current = JSON.parse(stored) as MarketingCommand;
  if (current.body.operationId !== command.body.operationId) return;
  if (typeof status === "number" && status >= 200 && status < 300)
    sessionStorage.removeItem(command.key);
  else if (typeof status !== "number" || status >= 500) {
    sessionStorage.setItem(
      command.key,
      JSON.stringify({ ...current, uncertain: true }),
    );
  } else if (!current.uncertain) sessionStorage.removeItem(command.key);
  announce();
}
export function pendingMarketingCommands(
  projectId: string | null,
): MarketingCommand[] {
  const scope = currentScope();
  if (!scope || !projectId) return [];
  const commands: MarketingCommand[] = [];
  for (let index = 0; index < sessionStorage.length; index++) {
    const key = sessionStorage.key(index);
    if (!key?.startsWith(PREFIX)) continue;
    try {
      const command = JSON.parse(
        sessionStorage.getItem(key) || "null",
      ) as MarketingCommand;
      if (
        command?.scope === scope &&
        command.projectId === projectId &&
        command.uncertain &&
        allowed(command.kind, command.path)
      )
        commands.push(command);
    } catch {
      /* An unreadable local entry is never sent as a command. */
    }
  }
  return commands;
}
export async function recoverMarketingCommand(
  command: MarketingCommand,
  projectId: string | null,
) {
  if (command.scope !== currentScope() || command.projectId !== projectId)
    throw new MarketingRecoveryRequired("command_scope_changed");
  const requestScope = marketingRequestScope();
  const send = () => {
    const session = readClientSession();
    if (!session) throw new MarketingRecoveryRequired("sign_in_required");
    return fetch(
      apiRoot() + (command.kind === "suite" ? "/api/suite" : "") + command.path,
      {
        method: command.method,
        signal: AbortSignal.timeout(30000),
        headers: {
          authorization: `Bearer ${session.tokens.accessToken}`,
          "x-workspace": session.workspaceContext?.workspace.id || "",
          "content-type": "application/json",
        },
        body: JSON.stringify(command.body),
      },
    );
  };
  try {
    let response = await send();
    if (response.status === 401 && readClientSession()?.tokens.refreshToken) {
      await refreshClientSession(SOS_API_URL);
      if (
        command.scope !== currentScope() ||
        requestScope !== marketingRequestScope()
      )
        throw new MarketingRecoveryRequired("command_scope_changed");
      response = await send();
    }
    const result = await response.json();
    if (
      command.scope !== currentScope() ||
      requestScope !== marketingRequestScope()
    )
      throw new MarketingRecoveryRequired("command_scope_changed");
    settleMarketingCommand(command, response.status);
    if (!response.ok)
      throw Object.assign(new Error("command_recovery_denied"), {
        status: response.status,
      });
    return result.data;
  } catch (error) {
    settleMarketingCommand(
      command,
      error && typeof error === "object" && "status" in error
        ? String(error.status)
        : undefined,
    );
    throw error;
  }
}
export async function marketingSuiteCommand<T>(
  projectId: string | null,
  path: string,
  body: Body,
  run: (body: Body) => Promise<T>,
) {
  const command = prepareMarketingCommand("suite", projectId, path, body);
  const requestScope = marketingRequestScope();
  try {
    const result = await run(command?.body || body);
    if (
      requestScope !== marketingRequestScope() ||
      (command && command.scope !== currentScope())
    )
      throw new MarketingRecoveryRequired("command_scope_changed");
    settleMarketingCommand(command, 200);
    return result;
  } catch (error) {
    const status =
      error &&
      typeof error === "object" &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : undefined;
    settleMarketingCommand(command, status);
    throw error;
  }
}
