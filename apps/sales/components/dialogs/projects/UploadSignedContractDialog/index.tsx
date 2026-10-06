"use client";

// The customer's signed contract, as a PDF or a photo (FileField: a real file input, with refused
// files named). Uploading confirms the project; replacing a signed copy keeps it confirmed.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileField } from "@orgtik/ui";
import { FormDialog } from "@/components/shared/FormDialog";
import { useSignContractMutation } from "@/redux/features/contracts/contractsApi";
import { isolate } from "@/lib/bidi";

const MAX_BYTES = 10 * 1024 * 1024;

type Props = {
  contractId: string;
  projectName: string;
  replacing: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function UploadSignedContractDialog({ contractId, projectName, replacing, open, onOpenChange }: Props) {
  const t = useTranslations("Projects");
  const [files, setFiles] = useState<File[]>([]);
  const [missing, setMissing] = useState(false);
  const [sign] = useSignContractMutation();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      onClosed={() => {
        setFiles([]);
        setMissing(false);
      }}
      size="md"
      title={replacing ? t("replaceSignedTitle") : t("uploadSignedTitle")}
      description={t("uploadSignedBody", { name: isolate(projectName) })}
      submitLabel={t("uploadSignedSubmit")}
      cancelLabel={t("cancel")}
      onSubmit={async () => {
        const file = files[0];
        if (!file) {
          setMissing(true);
          throw new Error("no file");
        }
        await sign({ contractId, signedContract: file }).unwrap();
      }}
    >
      <FileField
        label={t("signedFile")}
        value={files}
        onChange={(next) => {
          setFiles(next);
          setMissing(false);
        }}
        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
        maxSize={MAX_BYTES}
        multiple={false}
        description={t("signedFileHint")}
      />
      {missing ? (
        <p role="alert" className="text-body-sm text-danger">
          {t("signedFileMissing")}
        </p>
      ) : null}
    </FormDialog>
  );
}
