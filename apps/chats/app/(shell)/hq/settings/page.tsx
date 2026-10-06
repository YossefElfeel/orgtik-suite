import { titled } from "@/lib/server-i18n";
import { SettingsView } from "@/features/shell/SettingsView";

export const generateMetadata = titled("page.settings", "Settings");

export default function SettingsPage() {
  return <SettingsView />;
}
