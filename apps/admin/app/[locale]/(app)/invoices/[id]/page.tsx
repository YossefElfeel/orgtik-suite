"use client";

import { useParams } from "next/navigation";
import { InvoiceDetail } from "@/components/billing/InvoiceDetail";
import { RequirePermission } from "@/components/frame/RequirePermission";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return (
    <RequirePermission permission="billing:view">
      <InvoiceDetail key={id} id={id} />
    </RequirePermission>
  );
}
