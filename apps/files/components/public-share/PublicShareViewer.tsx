"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "@phosphor-icons/react";
import { Button, toast, useFormatter } from "@orgtik/ui";
import { PublicPreview } from "@/components/public-share/PublicPreview";
import { PublicSharePasswordForm } from "@/components/public-share/PublicSharePasswordForm";
import { PublicShareHeader } from "@/components/public-share/PublicShareHeader";
import {
  PublicShareFolderView,
  type BreadcrumbEntry,
} from "@/components/public-share/PublicShareFolderView";
import {
  PublicShareMissingSecret,
  PublicShareOpening,
  PublicShareRateLimited,
  PublicShareUnavailable,
} from "@/components/public-share/PublicShareStatus";
import { saveBlob } from "@/lib/download";
import {
  fetchPublicShareBlob,
  publicShareDownloadPath,
  publicShareFileDownloadPath,
  useCreateShareSessionMutation,
  useGetPublicShareItemsQuery,
  useLazyGetPublicShareQuery,
} from "@/redux/features/shares/publicShareApi";
import {
  PublicShareFile,
  PublicShareFolder,
  PublicShareMetadata,
} from "@/types";

type GuestPhase =
  | "opening"
  | "password"
  | "ready"
  | "unavailable"
  | "rate_limited"
  | "missing_secret";

interface PublicShareViewerProps {
  shareId: string;
  secret?: string;
}

function getErrorStatus(error: unknown): number | null {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
  ) {
    return (error as { status: number }).status;
  }
  return null;
}

export function PublicShareViewer({
  shareId,
  secret: secretFromUrl,
}: PublicShareViewerProps) {
  const t = useTranslations("PublicShare");
  const f = useFormatter();
  const secretRef = useRef<string | null>(null);
  const bootstrapped = useRef(false);

  const [phase, setPhase] = useState<GuestPhase>("opening");
  const [passwordError, setPasswordError] = useState(false);
  const [metadata, setMetadata] = useState<PublicShareMetadata | null>(null);
  const [folderId, setFolderId] = useState<string | undefined>(undefined);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbEntry[]>([]);
  const [page, setPage] = useState(1);
  const [selectedFile, setSelectedFile] = useState<PublicShareFile | null>(
    null,
  );
  const [downloading, setDownloading] = useState(false);
  const [checkingPassword, setCheckingPassword] = useState(false);

  const [createSession] = useCreateShareSessionMutation();
  const [fetchShare] = useLazyGetPublicShareQuery();

  const clearSecretParam = useCallback(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("secret")) return;
    url.searchParams.delete("secret");
    const search = url.searchParams.toString();
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${search ? `?${search}` : ""}${url.hash}`,
    );
  }, []);

  const applyMetadata = useCallback((data: PublicShareMetadata) => {
    setMetadata(data);
    setPhase("ready");
    if (data.resource.type === "folder") {
      setFolderId(undefined);
      setBreadcrumbs([{ id: data.resource.id, name: data.resource.name }]);
      setPage(1);
      setSelectedFile(null);
    } else {
      setSelectedFile(data.resource);
    }
  }, []);

  const loadMetadata = useCallback(async () => {
    try {
      const result = await fetchShare(shareId).unwrap();
      applyMetadata(result.data);
    } catch (err) {
      const status = getErrorStatus(err);
      if (status === 429) setPhase("rate_limited");
      else setPhase("unavailable");
    }
  }, [applyMetadata, fetchShare, shareId]);

  const exchangeSession = useCallback(
    async (secret: string, pwd?: string) => {
      try {
        await createSession({
          shareId,
          secret,
          ...(pwd ? { password: pwd } : {}),
        }).unwrap();
        secretRef.current = null;
        clearSecretParam();
        setPasswordError(false);
        await loadMetadata();
      } catch (err) {
        const status = getErrorStatus(err);
        if (status === 401) {
          setPhase("password");
          if (pwd) setPasswordError(true);
          return;
        }
        if (status === 429) {
          setPhase("rate_limited");
          return;
        }
        setPhase("unavailable");
      }
    },
    [clearSecretParam, createSession, loadMetadata, shareId],
  );

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const secret =
      secretFromUrl ||
      new URLSearchParams(window.location.search).get("secret");
    if (!secret) {
      void (async () => {
        try {
          const result = await fetchShare(shareId).unwrap();
          applyMetadata(result.data);
        } catch (err) {
          const status = getErrorStatus(err);
          if (status === 401 || status === 403) setPhase("missing_secret");
          else if (status === 429) setPhase("rate_limited");
          else setPhase("unavailable");
        }
      })();
      return;
    }

    secretRef.current = secret;
    void exchangeSession(secret);
  }, [applyMetadata, exchangeSession, fetchShare, secretFromUrl, shareId]);

  const handlePasswordSubmit = async (password: string) => {
    const secret = secretRef.current;
    if (!secret) return;
    setPasswordError(false);
    setCheckingPassword(true);
    await exchangeSession(secret, password);
    setCheckingPassword(false);
  };

  const itemsQuery = useGetPublicShareItemsQuery(
    {
      shareId,
      parentFolderId: folderId,
      page,
      limit: 50,
    },
    {
      skip:
        phase !== "ready" ||
        !metadata ||
        metadata.resource.type !== "folder" ||
        selectedFile != null,
    },
  );

  const openFolder = (folder: PublicShareFolder) => {
    setSelectedFile(null);
    setFolderId(folder.id);
    setPage(1);
    setBreadcrumbs((prev) => {
      const idx = prev.findIndex((b) => b.id === folder.id);
      if (idx >= 0) return prev.slice(0, idx + 1);
      return [...prev, { id: folder.id, name: folder.name }];
    });
  };

  const goToBreadcrumb = (index: number) => {
    const target = breadcrumbs[index];
    if (!target || !metadata || metadata.resource.type !== "folder") return;
    setSelectedFile(null);
    setPage(1);
    if (index === 0) {
      setFolderId(undefined);
      setBreadcrumbs([
        { id: metadata.resource.id, name: metadata.resource.name },
      ]);
      return;
    }
    setFolderId(target.id);
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
  };

  const handleDownload = async (file?: PublicShareFile) => {
    if (!metadata?.capabilities.canDownload) return;
    setDownloading(true);
    try {
      const path =
        file && metadata.resource.type === "folder"
          ? publicShareFileDownloadPath(shareId, file.id)
          : publicShareDownloadPath(shareId);
      const blob = await fetchPublicShareBlob(path);
      const name =
        file?.originalName ||
        file?.name ||
        (metadata.resource.type === "file"
          ? metadata.resource.originalName || metadata.resource.name
          : `${metadata.resource.name}.zip`);
      saveBlob(blob, name);
    } catch {
      toast.error(t("downloadFailed"));
    } finally {
      setDownloading(false);
    }
  };

  if (phase === "opening") return <PublicShareOpening />;
  if (phase === "missing_secret") return <PublicShareMissingSecret />;
  if (phase === "unavailable") return <PublicShareUnavailable />;
  if (phase === "rate_limited") return <PublicShareRateLimited onRetry={() => window.location.reload()} />;
  if (phase === "password") {
    return (
      <PublicSharePasswordForm
        error={passwordError}
        submitting={checkingPassword}
        onSubmit={handlePasswordSubmit}
      />
    );
  }

  if (!metadata) return null;

  const canDownload = metadata.capabilities.canDownload;
  const canPreview = metadata.capabilities.canPreview;
  const previewFile =
    selectedFile ||
    (metadata.resource.type === "file" ? metadata.resource : null);

  return (
    <div className="min-h-dvh bg-canvas">
      <PublicShareHeader
        metadata={metadata}
        previewFile={previewFile}
        downloading={downloading}
        onDownload={() =>
          handleDownload(
            previewFile && metadata.resource.type === "folder"
              ? previewFile
              : undefined,
          )
        }
      />

      <main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6">
        {metadata.resource.type === "folder" && !previewFile && (
          <PublicShareFolderView
            breadcrumbs={breadcrumbs}
            items={itemsQuery.data?.data}
            isLoading={itemsQuery.isLoading}
            isError={itemsQuery.isError}
            onRetry={() => void itemsQuery.refetch()}
            canDownload={canDownload}
            onBreadcrumbClick={goToBreadcrumb}
            onOpenFolder={openFolder}
            onOpenFile={setSelectedFile}
            onDownloadFile={(file) => void handleDownload(file)}
            onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
            onNextPage={() => setPage((p) => p + 1)}
          />
        )}

        {previewFile && (
          <div className="flex flex-col gap-4">
            {metadata.resource.type === "folder" && (
              <Button
                variant="ghost"
                size="sm"
                startIcon={<ArrowLeft className="rtl:-scale-x-100" />}
                onClick={() => setSelectedFile(null)}
              >
                {t("backTo", { name: breadcrumbs[breadcrumbs.length - 1]?.name ?? t("root") })}
              </Button>
            )}
            {canPreview ? (
              <div className="rounded-card border border-line bg-raised p-4">
                <PublicPreview shareId={shareId} fileId={previewFile.id} />
              </div>
            ) : (
              <div className="rounded-card border border-line bg-raised p-8 text-center text-body-sm text-fg-muted">
                {t("previewUnsupported")}
              </div>
            )}
            {previewFile.type === "file" && (
              <p className="text-center text-caption tabular-nums text-fg-muted">
                {f.bytes(previewFile.size)}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
