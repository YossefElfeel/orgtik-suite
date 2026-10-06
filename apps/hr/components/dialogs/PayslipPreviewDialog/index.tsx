"use client";
import { CircleNotch as Loader2 } from "@phosphor-icons/react";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useGetPayslipPreviewQuery, useGetMyPayslipPreviewQuery } from "@/redux/features/payroll/payrollApi";
import { useGetEmployeePayslipPreviewQuery } from "@/redux/features/employee/employeeApi";
import { triggerProps } from "@/lib/trigger";

interface PayslipPreviewDialogProps {
  id: number;
  children: React.ReactNode;
  variant?: "hr" | "employee" | "employee-detail";
  employeeId?: string | number;
}

function PayslipPreviewContent({
  id,
  variant = "hr",
  employeeId,
}: {
  id: number;
  variant?: "hr" | "employee" | "employee-detail";
  employeeId?: string | number;
}) {
  const t = useTranslations("payroll.payslip");
  const hrQuery = useGetPayslipPreviewQuery(id, { skip: variant !== "hr" });
  const employeeQuery = useGetMyPayslipPreviewQuery(id, {
    skip: variant !== "employee",
  });
  const employeeDetailQuery = useGetEmployeePayslipPreviewQuery(
    { employeeId: employeeId!, payslipId: id },
    { skip: variant !== "employee-detail" || employeeId == null },
  );
  const { data: blob, isLoading, error } =
    variant === "employee"
      ? employeeQuery
      : variant === "employee-detail"
        ? employeeDetailQuery
        : hrQuery;
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [blob]);

  if (isLoading) {
    return (
      <div role="status" className="flex h-[500px] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <span className="text-sm text-secondary font-medium">{t("loading")}</span>
      </div>
    );
  }

  if (error || !pdfUrl) {
    return (
      <div className="flex h-[500px] items-center justify-center text-danger font-medium">
        <span>{t("previewError")}</span>
      </div>
    );
  }

  return (
    <iframe
      src={pdfUrl}
      className="h-[600px] w-full rounded-lg border border-border"
      title={t("previewTitle")}
    />
  );
}

export function PayslipPreviewDialog({
  id,
  children,
  variant = "hr",
  employeeId,
}: PayslipPreviewDialogProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("payroll.payslip");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger {...triggerProps(children)} />
      <DialogContent className="max-w-4xl w-full p-6">
        <DialogHeader>
          <DialogTitle>{t("previewTitle")}</DialogTitle>
        </DialogHeader>
        {open && (
          <PayslipPreviewContent
            id={id}
            variant={variant}
            employeeId={employeeId}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
