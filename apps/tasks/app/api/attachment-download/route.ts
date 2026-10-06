import { NextRequest, NextResponse } from "next/server";
import { TOKEN_COOKIE } from "@/constants";
import {
  isAllowedAttachmentUrl,
  resolveAttachmentUpstreamUrls,
} from "@/lib/attachmentDownloadUrls";

function getBearer(req: NextRequest): string | null {
  const raw = req.cookies.get(TOKEN_COOKIE)?.value;
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return typeof v === "string" ? v : v?.accessToken ?? null;
  } catch {
    return null;
  }
}

function contentDispositionAttachment(filename: string) {
  const ascii =
    filename.replace(/[^\x20-\x7E]/g, "_").slice(0, 200) || "download";
  const star = encodeURIComponent(filename).replace(
    /['()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"),
  );
  return `attachment; filename="${ascii}"; filename*=UTF-8''${star}`;
}

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("u");
  const name = req.nextUrl.searchParams.get("name")?.trim() || "download";

  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let fileUrl: string;
  try {
    fileUrl = decodeURIComponent(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  // Only stored files: on the API's own origin that means its /uploads/ paths, so the proxy can't be
  // used to read any other API answer with the person's token (TASKS-039).
  const apiOrigin = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_API_URL ?? "").origin;
    } catch {
      return "";
    }
  })();
  const isApiUpload = (u: string) => {
    try {
      const url = new URL(u);
      return url.origin === apiOrigin && url.pathname.startsWith("/uploads/");
    } catch {
      return false;
    }
  };
  const candidates = resolveAttachmentUpstreamUrls(fileUrl);
  const allowed = candidates.filter((u) => isAllowedAttachmentUrl(u) && (new URL(u).origin !== apiOrigin || isApiUpload(u)));

  if (allowed.length === 0) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

  const token = getBearer(req);

  let upstream: Response | null = null;

  for (const target of allowed) {
    // The bearer token goes to the API's own uploads only, never to another allowed host.
    const headers: HeadersInit = token && isApiUpload(target) ? { Authorization: `Bearer ${token}` } : {};
    try {
      const r = await fetch(target, { headers, cache: "no-store" });
      if (r.ok) {
        upstream = r;
        break;
      }
    } catch {
      /* try next candidate */
    }
  }

  if (!upstream?.ok) {
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 502 });
  }

  const body = upstream.body;
  const contentType =
    upstream.headers.get("content-type") || "application/octet-stream";

  if (!body) {
    const buf = await upstream.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDispositionAttachment(name),
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": contentDispositionAttachment(name),
      "Cache-Control": "no-store",
    },
  });
}
