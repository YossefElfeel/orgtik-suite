"use client";

// The project's contract: its status, whether the customer signed it, the document, and the next
// step for whoever can take it.
// - The customer (or the team for them) uploads the signed contract.
// - An admin or manager approves it once it is signed, setting the commission, or rejects it with a
//   reason. Both were fake buttons on the customer's page (SAL-015) and approval didn't wait for a
//   signature (SAL-067).
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, DownloadSimple, Eye, FileText, SealCheck, UploadSimple, X } from "@phosphor-icons/react";
import { Button, Card, CardHeader, ConfirmDialog, toast } from "@orgtik/ui";
import { SalesStatus } from "@/components/shared/SalesStatus";
import ApproveContractDialog from "@/components/dialogs/projects/ApproveContractDialog";
import ContractPreviewDialog from "@/components/dialogs/projects/ContractPreviewDialog";
import UploadSignedContractDialog from "@/components/dialogs/projects/UploadSignedContractDialog";
import { useRole } from "@/hooks/useRole";
import { useAppSelector } from "@/redux/app/hooks";
import { useRejectContractMutation } from "@/redux/features/contracts/contractsApi";
import { isolate } from "@/lib/bidi";
import { fetchContractDocument, saveBlob } from "@/lib/deals/documents";
import { useDealFormat } from "@/lib/deals/format";
import type { ProjectDetail } from "@/types/projects";

export default function ProjectContractCard({ project }: { project: ProjectDetail }) {
  const t = useTranslations("Projects");
  const fmt = useDealFormat();
  const { isAdmin, isManager, isCustomer, canEdit } = useRole();
  const token = useAppSelector((s) => s.auth.token);
  const [reject] = useRejectContractMutation();
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const contract = project.latestContract ?? null;

  if (!contract)
    return (
      <Card className="flex flex-col gap-3">
        <CardHeader title={t("contractTitle")} />
        <p className="text-body-sm text-fg-muted">{t("noContractBody")}</p>
      </Card>
    );

  const pending = contract.status === "pending";
  const signed = Boolean(contract.isSigntuerd);
  const approver = (isAdmin || isManager) && canEdit;
  const file = contract.signedPdfPath ?? contract.unsignedPdfPath ?? null;
  const fileName = file?.name || t("contractFileName", { id: project.displayId ?? project.id });

  const download = async () => {
    setDownloading(true);
    try {
      const doc = await fetchContractDocument(contract.id, token);
      saveBlob(doc.blob, doc.fileName || fileName);
    } catch {
      toast.error(t("documentError"));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader
        title={t("contractTitle")}
        description={t("contractCreated", { date: fmt.date(contract.createdAt) })}
        actions={<SalesStatus kind="contract" value={contract.status} />}
      />

      <p className="flex items-center gap-2 text-body text-fg">
        {signed ? <SealCheck aria-hidden weight="fill" className="size-5 shrink-0 text-fg-brand" /> : <FileText aria-hidden className="size-5 shrink-0 text-fg-muted" />}
        {signed ? (contract.confirmedAt ? t("signedOn", { date: fmt.date(contract.confirmedAt) }) : t("signed")) : t("notSigned")}
      </p>

      {contract.status === "approved" ? (
        <p className="text-body-sm text-fg-muted">
          {contract.approvedAt ? t("approvedOn", { date: fmt.date(contract.approvedAt), who: isolate(contract.approvedBy ?? "") }) : null}
        </p>
      ) : null}
      {contract.status === "rejected" && contract.rejectionReason ? (
        <div className="flex flex-col gap-1 rounded-field bg-sunken px-3 py-2">
          <span className="text-caption text-fg-muted">{t("rejectionReason")}</span>
          <p dir="auto" className="text-body-sm whitespace-pre-line text-fg">
            {contract.rejectionReason}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => setPreviewing(true)} startIcon={<Eye aria-hidden className="size-4" />}>
          {t("viewContract")}
        </Button>
        <Button variant="secondary" size="sm" loading={downloading} onClick={() => void download()} startIcon={<DownloadSimple aria-hidden className="size-4" />}>
          {t("downloadContract")}
        </Button>
        {pending && canEdit ? (
          <Button variant={isCustomer && !signed ? "primary" : "secondary"} size="sm" onClick={() => setUploading(true)} startIcon={<UploadSimple aria-hidden className="size-4" />}>
            {signed ? t("replaceSigned") : t("uploadSigned")}
          </Button>
        ) : null}
      </div>

      {pending && approver ? (
        <div className="flex flex-col gap-3 border-t border-line pt-4">
          <p className="text-body-sm text-fg-muted">{signed ? t("reviewReady") : t("reviewWaiting")}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setRejecting(true)} startIcon={<X aria-hidden className="size-4" />}>
              {t("reject")}
            </Button>
            <Button variant="primary" disabled={!signed} onClick={() => setApproving(true)} startIcon={<Check aria-hidden className="size-4" />}>
              {t("approve")}
            </Button>
          </div>
        </div>
      ) : null}

      {approver && pending ? <ApproveContractDialog project={project} contract={contract} open={approving} onOpenChange={setApproving} /> : null}
      <ConfirmDialog
        open={rejecting}
        onOpenChange={setRejecting}
        title={t("rejectTitle", { name: isolate(project.projectName) })}
        impact={t("rejectImpact", { amount: fmt.money(contract.grandTotal, contract.currency) })}
        confirmLabel={t("rejectConfirm")}
        reason={{ label: t("rejectReason"), required: true }}
        onConfirm={({ reason }) => reject({ contractId: contract.id, body: { rejectionReason: reason } }).unwrap()}
      />
      <UploadSignedContractDialog contractId={contract.id} projectName={project.projectName} replacing={signed} open={uploading} onOpenChange={setUploading} />
      <ContractPreviewDialog contractId={contract.id} title={fileName} open={previewing} onOpenChange={setPreviewing} />
    </Card>
  );
}
