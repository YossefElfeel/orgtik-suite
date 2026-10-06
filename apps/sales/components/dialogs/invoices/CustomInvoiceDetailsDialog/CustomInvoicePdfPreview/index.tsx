"use client";

import { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import { useDownloadCustomInvoicePdfMutation } from "@/redux/features/invoices/invoicesApi";
import { useTranslations } from "next-intl";

type Props = {
  invoiceId: string;
  fileName?: string;
};

export default function CustomInvoicePdfPreview({
  invoiceId,
  fileName,
}: Props) {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const [downloadPdf] = useDownloadCustomInvoicePdfMutation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    const loadPreview = async () => {
      setIsLoading(true);
      setHasError(false);
      setPreviewUrl(null);

      try {
        // Always re-wrap as application/pdf so the browser renders inline
        // instead of downloading (API often sends Content-Disposition: attachment).
        const blob = await downloadPdf(invoiceId).unwrap();
        if (cancelled) return;

        const buffer = await blob.arrayBuffer();
        if (cancelled) return;

        const pdfBlob = new Blob([buffer], { type: "application/pdf" });
        objectUrl = URL.createObjectURL(pdfBlob);
        setPreviewUrl(`${objectUrl}#toolbar=1&navpanes=0`);
      } catch {
        if (!cancelled) {
          setHasError(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadPreview();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [downloadPdf, invoiceId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 rounded-xl border border-border bg-muted/20">
        <Loader className="size-6 animate-spin text-secondary" />
        <span className="text-sm text-secondary">
          {tCommon("loadingDocument")}
        </span>
      </div>
    );
  }

  if (hasError || !previewUrl) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-xl border border-border bg-muted/20 px-4">
        <p className="text-sm text-muted-foreground">{t("pdfPreviewUnavailable")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted/20 p-2">
      <iframe
        src={previewUrl}
        title={fileName ?? t("pdfPreview")}
        className="h-[70vh] w-full rounded-lg border-0 bg-white"
      />
    </div>
  );
}
