import { titled } from "@/lib/server-i18n";
import { InsightsView } from "@/features/insights/InsightsView";

export const generateMetadata = titled("page.insights", "Insights");

export default function InsightsPage() {
  return <InsightsView />;
}
