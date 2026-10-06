"use client";

import TextFormEle from "@/components/ui/form/text-form-element";
import SelectFormEle, {
  SELECT_EMPTY_VALUE,
} from "@/components/ui/form/select-form-element";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

const EMPLOYEE_OPTIONS = [
  {
    value: "1",
    label: "Taha",
    id: "6690",
    department: "Design",
    type: "Full Time",
    email: "tanya.hill@example.com",
    phone: "(406) 555-0120",
    bankName: "Tahsan",
    accountName: "Taha",
    accountNo: "64736457588436478",
    iban: "IBAN64736457588436478",
    salary: 5000,
    totalLoans: 5000,
    paidLoans: 2000,
    paidMonthly: 400,
    remainsLoans: 3000,
    bonus: 100,
    deduction: 0,
  },
  {
    value: "2",
    label: "Alex Morgan",
    id: "6691",
    department: "Engineering",
    type: "Full Time",
    email: "alex.morgan@example.com",
    phone: "(406) 555-0121",
    bankName: "Credit Suisse",
    accountName: "Alex Morgan",
    accountNo: "12345678901234567",
    iban: "IBAN12345678901234567",
    salary: 7000,
    totalLoans: 0,
    paidLoans: 0,
    paidMonthly: 0,
    remainsLoans: 0,
    bonus: 200,
    deduction: 0,
  },
];

const FORM_ID = "payroll-detail-form";

export default function PayrollDetailPage() {
  const t = useTranslations("payroll.detailPage");

  const schema = z.object({
    employeeId: z.string().min(1, t("validation.employeeRequired")),
    loanMonthly: z.number().min(0, t("validation.loanMonthlyMin")),
    note: z.string().max(250, t("validation.noteMax")),
  });

  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: "",
      loanMonthly: 0,
      note: "",
    },
  });

  const employeeId = useWatch({ control: form.control, name: "employeeId" });
  const note = useWatch({ control: form.control, name: "note" });
  const loanMonthly = useWatch({ control: form.control, name: "loanMonthly" });

  const selectedEmployee = EMPLOYEE_OPTIONS.find((e) => e.value === employeeId);

  const salary = selectedEmployee?.salary ?? 0;
  const bonus = selectedEmployee?.bonus ?? 0;
  const deduction = selectedEmployee?.deduction ?? 0;
  const total = salary + bonus - deduction - (loanMonthly ?? 0);

  function onSubmit(_data: FormValues) {
    // submit logic here
  }

  const employeeSelectOptions = [
    { value: SELECT_EMPTY_VALUE, label: t("fields.employeePlaceholder") },
    ...EMPLOYEE_OPTIONS,
  ];

  return (
    <div className="rounded-lg border p-6 space-y-6 w-full">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{t("title")}</h2>
        <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
      </div>

      <FormProvider {...form}>
        <form
          id={FORM_ID}
          className="space-y-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {/* Employee selector */}
          <SelectFormEle
            form={form}
            name="employeeId"
            label={t("fields.employee")}
            placeholder={t("fields.employeePlaceholder")}
            options={employeeSelectOptions}
            emptyOptionValue={SELECT_EMPTY_VALUE}
          />

          {/* Read-only employee info */}
          <div className="grid grid-cols-3 gap-6">
            <TextFormEle
              form={form as any}
              name={"_employeeId" as any}
              label={t("fields.employeeId")}
              disabled
              readOnly
              inputClassName="bg-muted"
              placeholder={selectedEmployee?.id ?? "—"}
            />
            <TextFormEle
              form={form as any}
              name={"_department" as any}
              label={t("fields.department")}
              disabled
              readOnly
              inputClassName="bg-muted"
              placeholder={selectedEmployee?.department ?? "—"}
            />
            <TextFormEle
              form={form as any}
              name={"_employeeType" as any}
              label={t("fields.employeeType")}
              disabled
              readOnly
              inputClassName="bg-muted"
              placeholder={selectedEmployee?.type ?? "—"}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <TextFormEle
              form={form as any}
              name={"_email" as any}
              label={t("fields.emailAddress")}
              disabled
              readOnly
              inputClassName="bg-muted"
              placeholder={selectedEmployee?.email ?? "—"}
            />
            <TextFormEle
              form={form as any}
              name={"_phone" as any}
              label={t("fields.phoneNumber")}
              disabled
              readOnly
              inputClassName="bg-muted"
              placeholder={selectedEmployee?.phone ?? "—"}
            />
          </div>

          {/* Divider */}
          <hr className="border-border" />

          {/* Bank Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              {t("sections.bankInformation")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextFormEle
                form={form as any}
                name={"_bankName" as any}
                label={t("fields.bankName")}
                disabled
                readOnly
                inputClassName="bg-muted"
                placeholder={selectedEmployee?.bankName ?? "—"}
              />
              <TextFormEle
                form={form as any}
                name={"_accountName" as any}
                label={t("fields.accountName")}
                disabled
                readOnly
                inputClassName="bg-muted"
                placeholder={selectedEmployee?.accountName ?? "—"}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextFormEle
                form={form as any}
                name={"_accountNo" as any}
                label={t("fields.accountNo")}
                disabled
                readOnly
                inputClassName="bg-muted"
                placeholder={selectedEmployee?.accountNo ?? "—"}
              />
              <TextFormEle
                form={form as any}
                name={"_iban" as any}
                label={t("fields.iban")}
                disabled
                readOnly
                inputClassName="bg-muted"
                placeholder={selectedEmployee?.iban ?? "—"}
              />
            </div>
          </div>

          {/* Divider */}
          <hr className="border-border" />

          {/* Loans */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              {t("sections.loans")}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              <LoanStatCard
                value={`${selectedEmployee?.totalLoans?.toLocaleString() ?? 0} CHF`}
                label={t("loans.total")}
              />
              <LoanStatCard
                value={`${selectedEmployee?.paidLoans?.toLocaleString() ?? 0} CHF`}
                label={t("loans.paid")}
              />
              <LoanStatCard
                value={`${selectedEmployee?.paidMonthly?.toLocaleString() ?? 0} CHF`}
                label={t("loans.paidMonthly")}
              />
              <LoanStatCard
                value={`${selectedEmployee?.remainsLoans?.toLocaleString() ?? 0} CHF`}
                label={t("loans.remains")}
              />
            </div>
          </div>

          {/* Divider */}
          <hr className="border-border" />

          {/* Salary Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              {t("sections.salaryDetails")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextFormEle
                form={form as any}
                name={"_salary" as any}
                label={t("fields.salary")}
                disabled
                readOnly
                inputClassName="bg-muted"
                placeholder={
                  selectedEmployee ? `${salary.toLocaleString()} CHF` : "—"
                }
              />
              <TextFormEle
                form={form}
                name="loanMonthly"
                label={t("fields.loanMonthly")}
                type="number"
                placeholder="0"
                suffix="CHF"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextFormEle
                form={form as any}
                name={"_bonus" as any}
                label={t("fields.bonus")}
                disabled
                readOnly
                inputClassName="bg-muted"
                placeholder={
                  selectedEmployee ? `${bonus.toLocaleString()} CHF` : "—"
                }
              />
              <TextFormEle
                form={form as any}
                name={"_deduction" as any}
                label={t("fields.deduction")}
                disabled
                readOnly
                inputClassName="bg-muted"
                placeholder={
                  selectedEmployee ? `${deduction.toLocaleString()}` : "—"
                }
              />
            </div>

            <TextFormEle
              form={form as any}
              name={"_total" as any}
              label={t("fields.total")}
              disabled
              readOnly
              inputClassName="bg-muted"
              placeholder={
                selectedEmployee ? `${total.toLocaleString()} CHF` : "—"
              }
            />

            <TextFormEle
              form={form}
              name="note"
              label={t("fields.note")}
              type="textarea"
              placeholder={t("fields.notePlaceholder")}
              inputClassName="min-h-[120px]"
            />
            <div className="flex justify-end">
              <p className="text-xs text-muted-foreground">
                {(note ?? "").length}/250
              </p>
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}

function LoanStatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-2 space-y-1">
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
