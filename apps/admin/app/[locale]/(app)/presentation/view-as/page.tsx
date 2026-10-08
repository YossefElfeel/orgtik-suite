import { notFound } from "next/navigation";
import { CustomerPreview } from "@/components/presentation/CustomerPreview";
export default async function CustomerPreviewPage({ searchParams }: { searchParams: Promise<{ workspace?: string | string[]; readOnly?: string | string[] }> }) {
  if (process.env.NODE_ENV !== "development" && process.env.NEXT_PUBLIC_DEMO_PANEL !== "1") notFound();
  const query = await searchParams;
  const workspace = typeof query.workspace === "string" ? query.workspace : "";
  return <CustomerPreview workspaceId={workspace} auditedReadOnly={query.readOnly === "true"} />;
}
