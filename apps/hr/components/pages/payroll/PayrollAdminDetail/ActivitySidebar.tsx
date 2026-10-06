"use client";
import { TrendUp as TrendingUp } from "@phosphor-icons/react";

import React from "react";
import { useTranslations } from "next-intl";
import { IActivityLog } from "../EmployeeApprovalCard";

interface ActivitySidebarProps {
    logs: IActivityLog[];
}

export default function ActivitySidebar({ logs }: ActivitySidebarProps) {
    const t = useTranslations("payroll.adminDetail");
    return (
        <div className="w-full bg-raised border border-line rounded-[16px] p-6 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-line">
                <TrendingUp className="size-5 text-secondary" aria-hidden="true" />
                <h3 className="text-title-sm font-medium text-gray-black">{t("activity")}</h3>
            </div>

            <div className="space-y-5 relative">
                {logs.length === 0 ? (
                    <p className="text-caption text-secondary italic">{t("noActivity")}</p>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="flex gap-4 items-start relative">
                            <div className="min-w-0 flex-1 border-b pb-4 last:border-b-0">
                                <h4 className="text-body font-medium text-gray-black">{log.title}</h4>
                                <p className="text-caption text-secondary">
                                    {log.user} <span className="mx-0.5">•</span> {log.timestamp}
                                </p>
                                {log.details && (
                                    <p dir="auto" className="text-caption text-secondary italic font-normal truncate mt-1">
                                        "{log.details}"
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}