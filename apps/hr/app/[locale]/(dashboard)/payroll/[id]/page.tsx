"use client";

import PendingApprovalsPage from "@/components/pages/payroll/PayrollAdminDetail";
import MainHeader from "@/components/layout/MainHeader";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation"; 
import { useGetPayrollRunByIdAdminQuery } from "@/redux/features/payroll/payrollApi";

export default function Page() {
  const t = useTranslations("payroll");
  const tErrors = useTranslations("errors");
  const params = useParams(); 
  const id = params?.id;
  
  if (!id) {
    return (
      <div className="flex items-center justify-center py-20">
        <p>{tErrors("notFoundTitle")}</p>
      </div>
    );
  }
  
  const { data, isLoading } = useGetPayrollRunByIdAdminQuery(Number(id));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p role="status">{t("status.loading")}</p>
      </div>
    );
  }

  if (!data || !data.data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p>{tErrors("notFoundTitle")}</p>
      </div>
    );
  }

  return (
    <>
      <MainHeader title={t("title")} />
      <section className="main-padding">        
       
        <PendingApprovalsPage runData={data.data} /> 
      </section>
    </>
  );
}