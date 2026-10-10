"use client";

// Export on the people directory (FS-HR-9, HR-010): it had no handler. It downloads the list the
// person is looking at, with the search and department filter from the address (every page of it,
// not just the one on screen), as a CSV that opens cleanly in a spreadsheet (lib/csv).
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useEmploymentTypeLabel } from "@/hooks/useEmploymentTypeLabel";
import { toast } from "sonner";
import { DownloadSimple } from "@phosphor-icons/react";
import { Button } from "@orgtik/ui";
import { useLazyGetEmployeesQuery } from "@/redux/features/employee/employeeApi";
import { downloadCsv, toCsv } from "@/lib/csv";
import type { IEmployee } from "@/types/employee";

const PAGE = 100;

export function ExportEmployeesButton({ className }: { className?: string }) {
  const t = useTranslations("employees");
  const tCol = useTranslations("employeeTable.columns");
  const employmentType = useEmploymentTypeLabel();
  const format = useFormatter();
  const params = useSearchParams();
  const [fetchPage] = useLazyGetEmployeesQuery();
  const [busy, setBusy] = useState(false);

  const exportList = async () => {
    setBusy(true);
    try {
      const search = params.get("q") || undefined;
      const dept = params.get("dept");
      const departmentId = dept && dept !== "all" ? dept : undefined;
      const people: IEmployee[] = [];
      for (let page = 1; ; page++) {
        const res = await fetchPage({ page, limit: PAGE, search, departmentId }).unwrap();
        people.push(...(res.data?.items ?? []));
        if (page >= (res.data?.meta?.totalPages ?? 1)) break;
      }
      const csv = toCsv(
        [tCol("employeeName"), tCol("email"), tCol("department"), tCol("jobTitle"), tCol("jobType"), tCol("joinedDate")],
        people.map((p) => [p.fullName, p.email, p.departmentName, p.jobTitle, employmentType(p.employeeType), p.joinDate]),
      );
      const day = format.dateTime(new Date(), { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/[^\d]+/g, "-");
      downloadCsv(`${t("exportFile")}-${day}.csv`, csv);
      toast.success(t("exported", { count: people.length }));
    } catch {
      toast.error(t("exportFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="secondary" onClick={exportList} disabled={busy} aria-busy={busy} className={className}>
      <DownloadSimple className="size-4" aria-hidden="true" />
      {t("export")}
    </Button>
  );
}
