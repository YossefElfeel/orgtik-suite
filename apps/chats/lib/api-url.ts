/** Chats shares the hosted mock origin with SOS, but has its own API namespace. */
export function resolveChatsApiUrl(apiUrl?: string, sosApiUrl?: string): string {
  try {
    const explicit = Boolean(apiUrl?.trim());
    const url = new URL(explicit ? apiUrl!.trim() : sosApiUrl || "");
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) return "";
    const path = url.pathname.replace(/\/+$/, "");
    if (explicit) return url.origin + path.replace(/\/api$/, "");
    // Older hosted projects only configured SOS. Local APIs use separate ports,
    // so never guess a Chats endpoint from a local /api or an unrelated path.
    return ["/sos", "/sos/api"].includes(path) ? `${url.origin}/chats` : "";
  } catch {
    return "";
  }
}

export const CHATS_API_URL = resolveChatsApiUrl(process.env.NEXT_PUBLIC_API_URL, process.env.NEXT_PUBLIC_SOS_API_URL);
