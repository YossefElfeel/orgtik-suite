"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useTranslations } from "next-intl";
import Hls from "hls.js";
import {
  fetchPublicShareBlob,
  publicShareAssetPath,
  useGetPublicPreviewQuery,
} from "@/redux/features/shares/publicShareApi";
import { PreviewManifest } from "@/types";
import { cn } from "@/lib/utils";
import { Skeleton, Spinner } from "@orgtik/ui";

interface PublicPreviewProps {
  shareId: string;
  fileId: string;
  className?: string;
}

function useCredentialedAssetUrl(
  shareId: string,
  fileId: string,
  assetKey: string | undefined,
) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!assetKey) {
      setUrl(null);
      return;
    }

    let objectUrl: string | null = null;
    const controller = new AbortController();

    (async () => {
      try {
        const blob = await fetchPublicShareBlob(
          publicShareAssetPath(shareId, fileId, assetKey),
          controller.signal,
        );
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
        setError(false);
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    })();

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [shareId, fileId, assetKey]);

  return { url, error };
}

function HlsMedia({
  shareId,
  fileId,
  entryKey,
  kind,
}: {
  shareId: string;
  fileId: string;
  entryKey: string;
  kind: "hls_video" | "hls_audio";
}) {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const [failed, setFailed] = useState(false);
  const t = useTranslations("PublicShare");

  useEffect(() => {
    const media = mediaRef.current;
    if (!media || !entryKey) return;

    let hls: Hls | null = null;
    const playlistUrl = `${process.env.NEXT_PUBLIC_API_URL}/api${publicShareAssetPath(shareId, fileId, entryKey)}`;

    if (
      media.canPlayType("application/vnd.apple.mpegurl") ||
      media.canPlayType("application/x-mpegURL")
    ) {
      media.src = playlistUrl;
      return () => {
        media.removeAttribute("src");
        media.load();
      };
    }

    if (Hls.isSupported()) {
      hls = new Hls({
        xhrSetup: (xhr) => {
          xhr.withCredentials = true;
        },
      });
      hls.loadSource(playlistUrl);
      hls.attachMedia(media);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) setFailed(true);
      });
      return () => {
        hls?.destroy();
      };
    }

    setFailed(true);
    return undefined;
  }, [shareId, fileId, entryKey, kind]);

  if (failed) {
    return (
      <p className="py-8 text-center text-body-sm text-fg-muted">
        {t("previewFailed")}
      </p>
    );
  }

  if (kind === "hls_audio") {
    return (
      <audio
        ref={mediaRef as RefObject<HTMLAudioElement>}
        controls
        className="w-full max-w-lg mx-auto"
        controlsList="nodownload"
      />
    );
  }

  return (
    <video
      ref={mediaRef as RefObject<HTMLVideoElement>}
      controls
      className="max-h-[70vh] w-full rounded-field bg-black"
      controlsList="nodownload"
      playsInline
    />
  );
}

function PageImage({
  shareId,
  fileId,
  assetKey,
  alt,
}: {
  shareId: string;
  fileId: string;
  assetKey: string;
  alt: string;
}) {
  const { url, error } = useCredentialedAssetUrl(shareId, fileId, assetKey);
  if (error) return null;
  if (!url) {
    return (
      <Skeleton className="h-48 w-full" />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      loading="lazy"
      className="h-auto w-full rounded-field shadow-raised"
    />
  );
}

function ReadyPreview({
  shareId,
  fileId,
  manifest,
}: {
  shareId: string;
  fileId: string;
  manifest: Extract<PreviewManifest, { status: "ready" }>;
}) {
  const t = useTranslations("PublicShare");

  if (manifest.kind === "image") {
    const key = manifest.entryKey || manifest.assets?.[0]?.key;
    if (!key) {
      return (
        <p className="py-8 text-center text-body-sm text-fg-muted">
          {t("previewFailed")}
        </p>
      );
    }
    return (
      <PageImage shareId={shareId} fileId={fileId} assetKey={key} alt="" />
    );
  }

  if (manifest.kind === "pages") {
    const assets = manifest.assets ?? [];
    if (assets.length === 0) {
      return (
        <p className="py-8 text-center text-body-sm text-fg-muted">
          {t("previewFailed")}
        </p>
      );
    }
    return (
      <div role="region" aria-label={t("pagesLabel")} tabIndex={0} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto rounded-field pe-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
        {assets.map((asset, index) => (
          <PageImage
            key={asset.key}
            shareId={shareId}
            fileId={fileId}
            assetKey={asset.key}
            alt={t("pageN", { n: index + 1 })}
          />
        ))}
      </div>
    );
  }

  if (manifest.kind === "hls_video" || manifest.kind === "hls_audio") {
    if (!manifest.entryKey) {
      return (
        <p className="py-8 text-center text-body-sm text-fg-muted">
          {t("previewFailed")}
        </p>
      );
    }
    return (
      <HlsMedia
        shareId={shareId}
        fileId={fileId}
        entryKey={manifest.entryKey}
        kind={manifest.kind}
      />
    );
  }

  return (
    <p className="py-8 text-center text-body-sm text-fg-muted">{t("previewFailed")}</p>
  );
}

export function PublicPreview({
  shareId,
  fileId,
  className,
}: PublicPreviewProps) {
  const t = useTranslations("PublicShare");
  const { data, error, isLoading, refetch } = useGetPublicPreviewQuery(
    { shareId, fileId },
    { pollingInterval: 0 },
  );

  const manifest = data?.data;
  const isProcessing =
    manifest?.status === "pending" || manifest?.status === "processing";

  useEffect(() => {
    if (!isProcessing) return;
    const id = window.setInterval(() => {
      void refetch();
    }, 4000);
    return () => window.clearInterval(id);
  }, [isProcessing, refetch]);

  if (isLoading && !manifest) {
    return (
      <div
        className={cn(
          "flex items-center justify-center py-16 text-body-sm text-fg-muted",
          className,
        )}
      >
        {t("previewProcessing")}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center py-16 text-body-sm text-fg-muted",
          className,
        )}
      >
        {t("previewFailed")}
      </div>
    );
  }

  if (!manifest) return null;

  if (manifest.status === "pending" || manifest.status === "processing") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 py-16 text-body-sm text-fg-muted",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <Spinner />
        {t("previewProcessing")}
      </div>
    );
  }

  if (manifest.status === "unsupported") {
    return (
      <div
        className={cn(
          "flex items-center justify-center py-16 text-body-sm text-fg-muted",
          className,
        )}
      >
        {t("previewUnsupported")}
      </div>
    );
  }

  if (manifest.status === "failed") {
    return (
      <div
        className={cn(
          "flex items-center justify-center py-16 text-body-sm text-fg-muted",
          className,
        )}
      >
        {t("previewFailed")}
      </div>
    );
  }

  if (manifest.status !== "ready") {
    return (
      <div
        className={cn(
          "flex items-center justify-center py-16 text-body-sm text-fg-muted",
          className,
        )}
      >
        {t("previewFailed")}
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <ReadyPreview shareId={shareId} fileId={fileId} manifest={manifest} />
    </div>
  );
}
