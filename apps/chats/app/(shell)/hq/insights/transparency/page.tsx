import { titled } from "@/lib/server-i18n";
import { TransparencyPage } from "@/features/insights/TransparencyPage";

export const generateMetadata = titled("page.transparency", "What we collect");

export default function Transparency() {
  return <TransparencyPage />;
}
