import { readClientSession, refreshClientSession } from "@orgtik/ui/auth";
import { API_URL, AUTH_API_URL } from "@/constants";
import { saveBlob } from "@/lib/deals/documents";
const authority = () => {
  const context = readClientSession()?.workspaceContext;
  return context
    ? JSON.stringify([
        context.realm,
        context.workspace.id,
        context.actor.userId,
        context.actor.effectiveUserId,
        context.member.accessEpoch,
        context.actor.readOnly,
      ])
    : "";
};
export async function downloadServiceDelivery(path: string, name: string) {
  if (
    !/^\/api\/suite\/services\/deliveries\/[^/]+\/[^/]+\/\d+\/content$/.test(
      path,
    )
  )
    throw Error("invalid delivery");
  const signature = authority(),
    session = readClientSession();
  if (!API_URL || !signature || !session?.workspaceContext)
    throw Error("session required");
  const base = API_URL;
  const current = () => {
    if (signature !== authority()) throw Error("workspace changed");
  };
  const send = async () => {
    current();
    const token = readClientSession()?.tokens.accessToken;
    if (!token) throw Error("session required");
    const response = await fetch(
      `${base.replace(/\/+$/, "").replace(/\/api$/, "")}${path}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Workspace": session.workspaceContext!.workspace.id,
        },
        cache: "no-store",
      },
    );
    current();
    return response;
  };
  let response = await send();
  if (response.status === 401) {
    await refreshClientSession(AUTH_API_URL);
    current();
    response = await send();
  }
  if (!response.ok) throw Error(`delivery ${response.status}`);
  const blob = await response.blob();
  current();
  saveBlob(blob, name);
}
