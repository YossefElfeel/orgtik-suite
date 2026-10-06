import { titled } from "@/lib/server-i18n";
import { BoardScreen } from "@/features/meetings/BoardScreen";

export const generateMetadata = titled("page.whiteboard", "Whiteboard");

export default function WhiteboardPage() {
  return <BoardScreen />;
}
