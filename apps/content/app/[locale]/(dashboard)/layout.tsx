import Sidebar from "@/components/layout/Sidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import SoSBarWrapper from "@/components/shared/SoSBarWrapper";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="flex h-screen overflow-hidden w-full">
      <SoSBarWrapper />
      <div className="hidden lg:flex">
        {/* Sidebar */}
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 bg-[#FAFCFE] overflow-hidden">
        {/* Header */}
        <DashboardHeader />

        <main className="flex-1 p-2 md:px-6 md:py-4 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </section>
  );
}
