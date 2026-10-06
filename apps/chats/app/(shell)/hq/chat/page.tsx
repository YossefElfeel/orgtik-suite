import { titled } from "@/lib/server-i18n";
import { ChatIndexView } from "@/features/chat/ChatIndexView";

export const generateMetadata = titled("page.chat", "Conversations");

/**
 * Chat with no channel selected. Where the sidebar exists this forwards to
 * Catch up; on a phone it is the list of conversations, which is the thing a
 * phone otherwise has no way to reach.
 */
export default function ChatIndex() {
  return <ChatIndexView />;
}
