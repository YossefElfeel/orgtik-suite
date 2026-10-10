import { FileWorkspace } from "@/components/workspace/FileWorkspace";
export default async function Page({ params }: { params: Promise<{ path: string[] }> }) { const { path } = await params; return <FileWorkspace folderId={path.at(-1)} />; }
