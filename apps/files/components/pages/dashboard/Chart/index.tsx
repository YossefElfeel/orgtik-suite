import React from "react";
import { ChartPieDonutText } from "./chart-pie";
import { PinnedFolders } from "./pinnedFolders";
import { RecentActivities } from "./recentActivities";

function Charts() {
  return (
    <div className="flex flex-col gap-4">
      <ChartPieDonutText />
      <div className="flex flex-col gap-4 rounded-card border border-line bg-raised p-2">
        <PinnedFolders />
        <RecentActivities />
      </div>
    </div>
  );
}

export default Charts;
