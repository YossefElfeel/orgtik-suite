import { FileRecord } from "@/components/pages/file-record";
export default async function Page({ params, searchParams }: { params: Promise<{ fileId: string }>; searchParams: Promise<{ versionId?: string }> }) {
  const { fileId } = await params;
  const { versionId } = await searchParams;
  return <FileRecord fileId={fileId} versionId={versionId} />;
}
