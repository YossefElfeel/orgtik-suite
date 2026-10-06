import { titled } from "@/lib/server-i18n";
import { SetupWizard } from "@/features/shell/SetupWizard";

export const generateMetadata = titled("page.setup", "Set up Chats");

export default function SetupPage() {
  return <SetupWizard />;
}
