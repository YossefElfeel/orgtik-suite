"use client";
import { handoffCode, readClientSession, sessionRequest } from "@orgtik/ui/auth";
import { SOS_API_URL } from "@/constants/env";
import { fileAuthority, FileRequestError } from "./file-references";
export async function openWhiteboard(boardId: string, versionId: string, workspaceId: string, locale: string): Promise<void> {
  const original = fileAuthority(), session = readClientSession();
  const current = () => Boolean(original && original === fileAuthority());
  if (!session?.workspaceContext || session.workspaceContext.workspace.id !== workspaceId) throw new FileRequestError("workspace_changed", 409);
  const scopes = await sessionRequest<{ name: string; domain: string; isActive: boolean }[]>(SOS_API_URL, "/auth/my-scopes", session.tokens.accessToken);
  if (!current()) throw new FileRequestError("workspace_changed", 409);
  const scope = scopes.find(item => item.name === "hq" && item.isActive);
  if (!scope?.domain) throw new FileRequestError("access_denied", 403);
  const destination = new URL(scope.domain.endsWith("/") ? scope.domain : scope.domain + "/");
  if (!["https:", "http:"].includes(destination.protocol) || destination.username || destination.password) throw new FileRequestError("invalid_destination", 400);
  const code = await handoffCode(SOS_API_URL, readClientSession()!.tokens.accessToken, "tool:chats");
  if (!current()) throw new FileRequestError("workspace_changed", 409);
  destination.pathname = destination.pathname.replace(/\/$/, "") + "/" + encodeURIComponent(locale) + "/auth";
  const query = new URLSearchParams({ boardId, versionId });
  destination.search = new URLSearchParams({ code, redirect: "/hq/whiteboard?" + query }).toString(); destination.hash = "";
  if (!current()) throw new FileRequestError("workspace_changed", 409);
  window.location.assign(destination.href);
}

