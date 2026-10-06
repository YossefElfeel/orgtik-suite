import { titled } from "@/lib/server-i18n";
import { ActivationScreen } from "@/features/shell/ActivationScreen";

export const generateMetadata = titled("page.activate", "Turn on Chats");

export default function ActivatePage() {
  return <ActivationScreen />;
}
