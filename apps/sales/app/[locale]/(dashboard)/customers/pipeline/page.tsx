"use client";

// The leads pipeline (D-028) on the library's Board: one column per stage. A lead moves by drag, by
// the keyboard on its handle, or by its "Move to" menu, and each move is saved with
// PATCH /customers/:id/status. A refused move goes back by itself, with the app's one toast. Lost
// asks for the reason first; cancelling puts the card back. The filters are the list's, in the
// address. A card opens the lead's page.
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Board, NoPermissionState, PageHeader, useStatusLabel, type BoardColumn, type BoardMove } from "@orgtik/ui";
import { useRouter } from "@/i18n/routing";
import { CustomerManagement } from "@/components/pages/customers/CustomerManagement";
import LeadToolbar from "@/components/pages/customers/LeadToolbar";
import LeadCard from "@/components/pages/customers/LeadCard";
import LostLeadDialog from "@/components/dialogs/customers/LostLeadDialog";
import { LEAD_STAGES, isLeadStatus, leadStatusOf, stageTone } from "@/components/pages/customers/leads";
import { INBOX_LIMIT, useLeadInbox } from "@/components/pages/customers/useLeadInbox";
import { useUpdateStatusMutation } from "@/redux/features/customers/customersApi";
import { useRole } from "@/hooks/useRole";
import type { Customer } from "@/types/customers";

type Item = { id: string; columnId: string; title: string; lead: Customer };
type AskLost = { lead: Customer; resolve: () => void; reject: (e: unknown) => void };

export default function LeadsPipelinePage() {
  const t = useTranslations("Customers");
  const label = useStatusLabel();
  const router = useRouter();
  const { isCustomer, isReady, isAdmin, isManager } = useRole();
  const data = useLeadInbox();
  const { inbox } = data;
  const [updateStatus] = useUpdateStatusMutation();
  const [askLost, setAskLost] = useState<AskLost | null>(null);
  const settled = useRef(false);

  if (isReady && isCustomer) return <NoPermissionState size="page" titleAs="h1" title={t("noAccessTitle")} description={t("noAccessBody")} />;

  const stages = inbox.filters.stages.length ? LEAD_STAGES.filter((s) => inbox.filters.stages.includes(s)) : LEAD_STAGES;
  const columns: BoardColumn[] = stages.map((s) => ({ id: s, title: label("lead", s), color: stageTone(s), count: data.stageCounts[s] ?? 0 }));
  const items: Item[] = data.shown.map((lead) => ({ id: lead.id, columnId: leadStatusOf(lead.status), title: lead.fullName, lead }));
  const byId = new Map(items.map((i) => [i.id, i.lead]));

  const onMove = async (m: BoardMove) => {
    // The pipeline is ordered by age; there is no order within a stage to save.
    if (m.toColumnId === m.fromColumnId || !isLeadStatus(m.toColumnId)) return;
    const lead = byId.get(m.itemId);
    if (!lead) return;
    if (m.toColumnId === "lost") {
      settled.current = false;
      await new Promise<void>((resolve, reject) => setAskLost({ lead, resolve, reject }));
      return;
    }
    await updateStatus({ id: lead.id, status: m.toColumnId }).unwrap();
  };

  const status = data.status === "loading" ? "loading" : data.status === "error" ? "error" : data.status === "forbidden" ? "no-permission" : data.all.length ? "ready" : "empty";
  const create = data.canEdit ? <CustomerManagement urlParam="new" /> : null;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("pipelineDescription")} actions={create} />
      <LeadToolbar view="pipeline" inbox={inbox} sources={data.sources} owners={data.owners} stageCounts={data.stageCounts} />
      {data.truncated ? <p className="text-caption text-fg-muted">{t("truncated", { count: INBOX_LIMIT })}</p> : null}
      <Board<Item>
        label={t("boardLabel")}
        columns={columns}
        items={items}
        status={status}
        onRetry={() => void data.refetch()}
        readOnly={!data.canEdit}
        onOpen={(item) => router.push(`/customers/${item.id}`)}
        onMove={onMove}
        countLabel={(n) => t("leadCount", { count: n })}
        labels={{ moveTo: t("moveTo", { title: "{title}" }) }}
        noResults={inbox.filtered ? { onClear: inbox.clear } : undefined}
        emptyAction={data.canEdit ? <CustomerManagement /> : undefined}
        renderCard={(item) => <LeadCard lead={item.lead} showOwner={isAdmin || isManager} />}
      />
      {askLost ? (
        <LostLeadDialog
          open
          name={askLost.lead.fullName}
          onOpenChange={(open) => {
            if (open) return;
            // Closed without saving: the card goes back to where it was.
            if (!settled.current) askLost.reject(new Error("cancelled"));
            setAskLost(null);
          }}
          onConfirm={async (reason) => {
            await updateStatus({ id: askLost.lead.id, status: "lost", lostReason: reason }).unwrap();
            settled.current = true;
            askLost.resolve();
          }}
        />
      ) : null}
    </section>
  );
}
