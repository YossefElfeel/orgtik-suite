"use client";
import { handoffCode, readClientSession, sessionRequest } from "@orgtik/ui/auth";
import { SOS_API_URL } from "@/lib/suite-session";
import { fileAuthority, FileRequestError, type FileReference } from "./file-references";

/** A tool-to-tool handoff uses this tab's workspace, never another SOS tab's selection. */
export async function openFileReference(reference: FileReference, locale: string): Promise<void> {
  const original = fileAuthority(), session = readClientSession();
  const current = () => original !== "" && original === fileAuthority();
  if (!session?.workspaceContext || reference.workspaceId !== session.workspaceContext.workspace.id) throw new FileRequestError("workspace_changed", 409);
  const scopes = await sessionRequest<{ name: string; domain: string; isActive: boolean }[]>(SOS_API_URL, "/auth/my-scopes", session.tokens.accessToken);
  if (!current()) throw new FileRequestError("workspace_changed", 409);
  const scope = scopes.find(item => item.name === "file_manager" && item.isActive);
  if (!scope?.domain) throw new FileRequestError("access_denied", 403);
  const destination = new URL(scope.domain.endsWith("/") ? scope.domain : scope.domain + "/");
  if (!["https:", "http:"].includes(destination.protocol) || destination.username || destination.password) throw new FileRequestError("invalid_destination", 400);
  const code = await handoffCode(SOS_API_URL, session.tokens.accessToken, "tool:files");
  if (!current()) throw new FileRequestError("workspace_changed", 409);
  destination.pathname = destination.pathname.replace(/\/$/, "") + "/" + encodeURIComponent(locale) + "/auth";
  const versionQuery = new URLSearchParams({ versionId: reference.versionId });
  destination.search = new URLSearchParams({ code, redirect: "/file/" + encodeURIComponent(reference.fileId) + "?" + versionQuery }).toString();
  destination.hash = "";
  if (!current()) throw new FileRequestError("workspace_changed", 409);
  window.location.assign(destination.href);
}

