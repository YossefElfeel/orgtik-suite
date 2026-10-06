import { DownloadSimple as Download } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function ResumeSection({
  resumeUrl,
  candidateName,
}: {
  resumeUrl?: string;
  candidateName?: string;
}) {
  const t = useTranslations("jobs");
  return (
    <section
      className={"flex w-full flex-col gap-4 rounded-2xl border  bg-raised p-6"}
    >
      <div className="flex items-center justify-between gap-4 border-b pb-4">
        <h3 className="text-title-sm leading-6 font-medium ">
          {candidateName || t("candidateDetails.candidate")} {t("candidateDetails.resume")}
        </h3>

        {resumeUrl ? (
          <a href={resumeUrl} target="_blank" rel="noreferrer">
            <Button type="button" variant="outline" size="lg">
              <Download className="size-4" />
              {t("candidateDetails.downloadPdf")}
            </Button>
          </a>
        ) : (
          <Button type="button" variant="outline" size="lg" disabled>
            <Download className="size-4" />
            {t("candidateDetails.resumeUnavailable")}
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border bg-muted/20">
        {resumeUrl ? (
          <iframe
            src={resumeUrl}
            title={`${candidateName || t("candidateDetails.candidate")} CV`}
            className="h-[900px] w-full"
          />
        ) : (
          <div className="flex h-[240px] items-center justify-center text-sm text-fg-subtle">
            {t("candidateDetails.cvPreviewUnavailable")}
          </div>
        )}
      </div>
    </section>
  );
}
