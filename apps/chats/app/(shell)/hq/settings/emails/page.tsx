import { titled } from "@/lib/server-i18n";
import { EmailPreviews } from "@/features/shell/EmailPreviews";

export const generateMetadata = titled("page.emails", "Email previews");

export default function EmailsPage() {
  return <EmailPreviews />;
}
