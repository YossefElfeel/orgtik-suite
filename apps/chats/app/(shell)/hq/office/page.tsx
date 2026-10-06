import { titled } from "@/lib/server-i18n";
import { OfficeScreen } from "@/features/office/OfficeScreen";

export const generateMetadata = titled("page.office", "Office");

export default function OfficePage() {
  return <OfficeScreen />;
}
