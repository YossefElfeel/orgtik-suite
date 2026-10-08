import { FileRecord } from "@/components/pages/file-record";
export default async function Page({ params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  return <FileRecord fileId={fileId} />;
}
