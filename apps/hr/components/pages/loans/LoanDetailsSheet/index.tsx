"use client";
import { Eye } from "@phosphor-icons/react";
import React, { useEffect } from "react";
import { IconButton } from "@/components/shared/IconButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/bindings/tabs";
import { Button } from "@orgtik/ui";
import { Badge } from "@orgtik/ui";
import ReusableSheet from "@/components/shared/ResuableSheet";
import { useGetLoanByIdQuery, useUpdateLoanByIdMutation, useUpdateLoanStatusByIdMutation, } from "@/redux/features/loan/loanApi";
import { IStatusLoans } from "@/types/loans";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { LoanFormValues } from "@/schemas/payroll/loan.schemas";
import TextFormEle from "@/components/ui/form/text-form-element";
import SelectFormEle from "@/components/ui/form/select-form-element";
import { Form } from "@/components/ui/form";
import StatusBadge from "@/components/bindings/EmploymentStatus";
import { useFormatter, useTranslations } from "next-intl";
interface LoanDetailsSheetProps {
    loanId: number;
    children?: React.ReactNode;
}
/* The edit form's values come from schemas/payroll/loan.schemas (makeLoanSchema); its resolver is off, as before. */
export default function LoanDetailsSheet({ loanId, children, }: LoanDetailsSheetProps) {
    const t = useTranslations("loans.details");
    const tActions = useTranslations("actions");
    const format = useFormatter();
    const [open, setOpen] = React.useState(false);
    /* ================= Fetch Loan ================= */
    const { data: loanResponse, isLoading, isError, } = useGetLoanByIdQuery(loanId!, {
        skip: !loanId || !open,
    });
    const loan = loanResponse?.data as any;
    /* ================= Mutations ================= */
    const [updateLoan, { isLoading: isUpdating }] = useUpdateLoanByIdMutation();
    const [updateStatus, { isLoading: isStatusUpdating }] = useUpdateLoanStatusByIdMutation();
    /* ================= Form ================= */
    const form = useForm<LoanFormValues>({
        // resolver: zodResolver(makeLoanSchema({ titleRequired: t("validation.titleRequired") })),
        defaultValues: {
            title: "",
            installmentAmount: 0,
            remainingAmount: 0,
            reason: "",
            status: "active",
        },
    });
    /* ================= Fill Form ================= */
    useEffect(() => {
        if (loan) {
            form.reset({
                title: loan.title,
                installmentAmount: loan.installmentAmount,
                remainingAmount: loan.remainingAmount,
                reason: loan.reason || "",
                status: loan.status,
            });
        }
    }, [loan]);
    if (!loanId)
        return null;
    // In the loan's own currency and the reader's language (it was the bare number and the code).
    const money = (amount: number) => loan?.currency
        ? format.number(Number(amount), { style: "currency", currency: loan.currency })
        : format.number(Number(amount), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    // A "YYYY-MM-DD" start date is that local day (not midnight UTC, which is the day before in the west).
    const dayMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(loan?.startDate ?? "");
    const startDate = dayMatch
        ? new Date(Number(dayMatch[1]), Number(dayMatch[2]) - 1, Number(dayMatch[3]))
        : loan?.startDate
            ? new Date(loan.startDate)
            : null;
    /* ================= Submit ================= */
    const handleSaveChanges = async (values: LoanFormValues) => {
        try {
            await updateLoan({
                id: loanId,
                body: {
                    ...values,
                },
            }).unwrap();
        }
        catch (error) {
            console.error("Failed to update loan:", error);
        }
    };
    /* ================= Status Change ================= */
    const handleStatusChange = async (newStatus: IStatusLoans) => {
        try {
            await updateStatus({ id: loanId, body: { status: newStatus } }).unwrap();
        }
        catch (error) {
            console.error("Failed to update status:", error);
        }
    };
    /* ================= Badge Colors ================= */
    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            active: "bg-success-subtle text-success",
            paused: "bg-warning-subtle text-warning",
            closed: "bg-info-subtle text-info",
            cancelled: "bg-danger-subtle text-danger",
        };
        return colors[status] || "bg-sunken text-fg";
    };
    return (<ReusableSheet open={open} onOpenChange={setOpen} trigger={children || (<IconButton label={tActions("viewDetails")} variant="secondary">
            <Eye className="size-4"/>
          </IconButton>)} title={t("sheetTitle")} description={loan ? t("manageFor", { name: loan.employee.name }) : t("loading")} size="lg">
      {isLoading ? (<div className="flex h-40 items-center justify-center">
          {t("loadingData")}
        </div>) : isError || !loan ? (<div className="text-center text-danger my-4">{t("failedLoad")}</div>) : (<Tabs defaultValue="details" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="details">{t("tabs.details")}</TabsTrigger>
            <TabsTrigger value="edit">{t("tabs.edit")}</TabsTrigger>
          </TabsList>

          {/* ================= DETAILS ================= */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card title={t("cards.totalAmount")} value={money(loan.principalAmount)}/>
              <Card title={t("cards.remainingAmount")} value={money(loan.remainingAmount)} danger/>
              <Card title={t("cards.paidAmount")} value={money(loan.paidAmount)} success/>
              <Card title={t("cards.monthlyInstallment")} value={money(loan.installmentAmount)}/>
            </div>

            <div className="border rounded-xl p-4 space-y-3 text-sm">
              <Row label={t("fields.employeeCode")} value={loan.employee.employeeCode}/>
              <Row label={t("fields.loanStatus")} value={<StatusBadge status={loan.status} size="sm"/>}/>
              <Row label={t("fields.startDate")} value={startDate && !Number.isNaN(startDate.getTime())
                ? format.dateTime(startDate, { dateStyle: "medium" })
                : "-"}/>
            </div>
          </TabsContent>

          {/* ================= EDIT ================= */}
          <TabsContent value="edit">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSaveChanges)} className="space-y-4 pt-2">
                <TextFormEle form={form} name="title" label={t("fields.loanTitle")}/>

                <div className="grid grid-cols-2 gap-4">
                  <TextFormEle form={form} name="installmentAmount" label={t("cards.monthlyInstallment")} type="number"/>
                  <TextFormEle form={form} name="remainingAmount" label={t("cards.remainingAmount")} type="number"/>
                </div>

                <SelectFormEle form={form} name="status" label={t("fields.loanStatus")} options={[
                { label: t("statusOptions.active"), value: "active" },
                { label: t("statusOptions.paused"), value: "paused" },
                { label: t("statusOptions.closed"), value: "closed" },
                { label: t("statusOptions.cancelled"), value: "cancelled" },
            ]}/>

                <TextFormEle form={form} name="reason" label={t("fields.reasonNotes")}/>

                {/* Quick Actions */}
                <div className="pt-4 border-t space-y-2">
                  <label className="text-xs text-muted-foreground block">
                    {t("fields.quickActions")}
                  </label>

                  <div className="flex gap-2">
                    {loan.status !== "active" && (<Button type="button" variant="secondary" size="sm" onClick={() => handleStatusChange("active")} disabled={isStatusUpdating}>
                        {t("fields.activate")}
                      </Button>)}

                    {loan.status === "active" && (<Button type="button" variant="secondary" size="sm" onClick={() => handleStatusChange("paused")} disabled={isStatusUpdating}>
                        {t("fields.pause")}
                      </Button>)}
                  </div>
                </div>

                <div className="pt-6 flex justify-end gap-2">
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? t("fields.saving") : t("fields.saveChanges")}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>)}
    </ReusableSheet>);
}
/* ================= Small UI Helpers ================= */
function Card({ title, value, danger, success, }: {
    title: string;
    value: string;
    danger?: boolean;
    success?: boolean;
}) {
    return (<div className="p-4 rounded-xl border bg-sunken/50">
      <span className="text-xs text-muted-foreground block mb-1">{title}</span>
      <span className={`text-lg font-bold ${danger ? "text-danger" : success ? "text-success" : ""}`}>
        {value}
      </span>
    </div>);
}
function Row({ label, value }: {
    label: string;
    value: React.ReactNode;
}) {
    return (<div className="flex justify-between items-center border-b pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>);
}
