"use client";

import { motion } from "framer-motion";
import BlogsViewsChart from "@/components/pages/home/BlogsViewsChart";
import HomeCards from "@/components/pages/home/HomeCards";
import WebsiteVisitorsChart from "@/components/pages/home/HomeCharts";
import ProgressBarsCard from "@/components/pages/home/ProgressBarsCard";
import TopBlogs from "@/components/pages/home/TopBlogs";
import { useGetDashboardStatsQuery } from "@/redux/features/dashboard/dashboardApi";

export default function Home() {
  const { data, isLoading } = useGetDashboardStatsQuery();

  if (isLoading) return <HomeSkeleton />;

  return (
    <section className="space-y-5">
      {/* ==== Top Statistic Cards ==== */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <HomeCards status={data?.data.stats ?? []} />
      </motion.div>

      {/* ==== Charts Row ==== */}
      <motion.div
        className="flex flex-col lg:flex-row items-stretch justify-between gap-3 h-auto lg:h-[400px]"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        <motion.div
          className="w-full lg:w-3/4 h-[300px] lg:h-full"
          transition={{ type: "spring", stiffness: 120 }}
        >
          <WebsiteVisitorsChart
            monthlyVisits={data?.data.monthlyVisits ?? []}
          />
        </motion.div>

        <motion.div
          className="w-full lg:w-1/4 h-[300px] lg:h-full"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <ProgressBarsCard topServices={data?.data.topServices ?? []} />
        </motion.div>
      </motion.div>

      {/* ==== Bottom Row ==== */}
      <motion.div
        className="flex flex-col lg:flex-row items-stretch justify-between gap-3"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        <motion.div
          className="w-full lg:w-1/2 flex"
          transition={{ type: "spring", stiffness: 120 }}
        >
          <TopBlogs topBlogs={data?.data.topBlogs ?? []} />
        </motion.div>

        <motion.div
          className="w-full lg:w-1/2 flex"
          transition={{ type: "spring", stiffness: 120 }}
        >
          <BlogsViewsChart
            blogViewsByService={data?.data?.blogViewsByService ?? []}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

function SkeletonBox({ className }: { className?: string }) {
  return (
    <div className={`bg-gray-200 rounded-lg animate-pulse ${className}`} />
  );
}

function HomeSkeleton() {
  return (
    <section className="space-y-5">
      {/* ==== Top Statistic Cards ==== */}
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBox key={i} className="h-32 w-full" />
        ))}
      </div>

      {/* ==== Charts Row ==== */}
      <div className="flex flex-col lg:flex-row items-stretch justify-between gap-3 h-auto lg:h-[400px]">
        <SkeletonBox className="w-full lg:w-3/4 h-72 lg:h-full" />
        <SkeletonBox className="w-full lg:w-1/4 h-72 lg:h-full" />
      </div>

      {/* ==== Bottom Row ==== */}
      <div className="flex flex-col lg:flex-row items-stretch justify-between gap-3">
        <SkeletonBox className="w-full lg:w-1/2 h-72 lg:h-full" />
        <SkeletonBox className="w-full lg:w-1/2 h-72 lg:h-full" />
      </div>
    </section>
  );
}
