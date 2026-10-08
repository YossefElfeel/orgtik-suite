import { titled } from "@/lib/server-i18n";
import { BoardScreen } from "@/features/meetings/BoardScreen";

export const generateMetadata = titled("page.whiteboard", "Whiteboard");

export default async function WhiteboardPage({ searchParams }: { searchParams: Promise<{ boardId?: string; versionId?: string }> }) {
  const query = await searchParams;
  return <BoardScreen boardId={query.boardId} versionId={query.versionId} />;
}
