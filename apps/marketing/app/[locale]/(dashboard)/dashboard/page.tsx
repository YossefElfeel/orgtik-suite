import { Dashboard } from "@/components/pages/home/Dashboard";
import MarketingOnboarding from "@/components/shared/MarketingOnboarding";
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <MarketingOnboarding />
      <Dashboard />
    </div>
  );
}
