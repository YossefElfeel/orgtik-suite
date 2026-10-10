import { API_URL } from "@/constants";
import { readClientSession } from "@orgtik/ui/auth";
import { marketingRequestScope } from "@/lib/request-scope";
export async function downloadMarketingHtml(path: string, name: string) {
  const session = readClientSession(),
    scope = marketingRequestScope(),
    response = await fetch(`${API_URL?.replace(/\/api\/?$/, "").replace(/\/$/, "")}${path}`, {
      headers: {
        ...(session
          ? {
              Authorization: `Bearer ${session.tokens.accessToken}`,
              "X-Workspace": session.workspaceContext?.workspace.id || "",
            }
          : {}),
      },
    });
  if (!response.ok || scope !== marketingRequestScope())
    throw Error("Current document unavailable");
  const blob = await response.blob();
  if (scope !== marketingRequestScope() || !blob.type.includes("text/html"))
    throw Error("Invalid document type");
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
