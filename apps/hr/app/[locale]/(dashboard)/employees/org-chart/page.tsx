"use client";
import { CircleNotch as Loader2, DownloadSimple as Download, MagnifyingGlass as Search, Plus, TreeStructure as Network, Users } from "@phosphor-icons/react";

import React, { useState } from "react";

import { OrgChart } from "@/components/shared/OrgChart";
import MainHeader from "@/components/layout/MainHeader";
import { MenuTabItem, TabMenu } from "@/components/shared/TabMenu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGetOrgChartQuery } from "@/redux/features/employee/employeeApi";
import { useTranslations } from "next-intl";

export default function OrgChartRoute() {
  const t = useTranslations("employees");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: orgChartData, isLoading } = useGetOrgChartQuery({});

  const orgItems = React.useMemo(() => {
    if (!orgChartData?.data) return [];

    const nodesRaw = orgChartData.data;
    const nodes = Array.isArray(nodesRaw)
      ? nodesRaw
      : (nodesRaw as any)?.data || [];

    if (!Array.isArray(nodes)) return [];

    const childToParent = new Map<string, string>();

    nodes.forEach((node: any) => {
      if (Array.isArray(node.children)) {
        node.children.forEach((childId: any) => {
          childToParent.set(childId.toString(), node.id.toString());
        });
      }
    });

    return nodes.map((node: any) => ({
      id: node.id.toString(),
      parentId: childToParent.get(node.id.toString()) ?? null,
      name: node.fullName,
      role: node.jobTitle,
      avatarUrl: node.avatarUrl,
    }));
  }, [orgChartData]);

  return (
    <div className="main-padding">
      <div className="flex items-center justify-between gap-4 pb-4">
        <div className="relative w-full max-w-[266px]">
          <Search className="pointer-events-none absolute top-1/2 start-2.5 size-4 -translate-y-1/2 text-fg-muted" />
          <Input
            placeholder={t("page.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 border-line bg-raised pe-2.5 ps-8 text-sm text-fg-muted placeholder:text-fg-muted shadow-[0px_1px_2px_0px_rgba(9,25,72,0.06)]"
          />
        </div>

        {/* <Button
          variant="outline"
          className="h-8 gap-1.5 rounded-lg border-line bg-raised px-3 text-xs font-medium text-fg-muted shadow-[0px_1px_2px_0px_rgba(9,25,72,0.06)] hover:bg-raised"
        >
          Edit ORG Chart
        </Button> */}
      </div>

      <div className="min-h-[500px]">
        {isLoading ? (
          <div className="flex h-[500px] items-center justify-center rounded-2xl border border-line bg-sunken">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : (
          <OrgChart className="min-h-[500px]" items={orgItems} />
        )}
      </div>
    </div>
  );
}
