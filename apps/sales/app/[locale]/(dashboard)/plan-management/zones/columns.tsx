"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import ZoneActions from "@/components/pages/plan-management/zone/ZoneActions";
import ZoneCodeChip from "@/components/pages/plan-management/zone/ZoneCodeChip";
import { useRole } from "@/hooks/useRole";
import type { Zone } from "@/types/zones";
import { useTranslations } from "next-intl";

export function useZoneColumns() {
  const { isSalesman } = useRole();
  const t = useTranslations("planManagement.zones");
  const tCommon = useTranslations("common");

  return useMemo(() => {
    const columns: ColumnDef<Zone>[] = [
    {
      accessorKey: "name",
      header: t("columnZone"),
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.original.name}</span>
      ),
    },
    {
      id: "currency",
      header: t("columnCurrency"),
      cell: ({ row }) => {
        const { defaultCurrency } = row.original;
        return (
          <div className="flex items-center gap-2">
            <ZoneCodeChip code={defaultCurrency.code} />
            <span className="text-14 text-secondary">{defaultCurrency.name}</span>
          </div>
        );
      },
    },
    {
      id: "countries",
      header: t("columnCountries"),
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-1.5">
          {row.original.countries.map((country) => (
            <ZoneCodeChip key={country.code} code={country.code} />
          ))}
        </div>
      ),
    },
    {
      id: "languages",
      header: tCommon("languages") || "Languages",
      cell: ({ row }) => {
        const { languages, defaultLanguageCode } = row.original;
        const ordered = [
          ...languages.filter(
            (language) => language.code === defaultLanguageCode,
          ),
          ...languages.filter(
            (language) => language.code !== defaultLanguageCode,
          ),
        ];

        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {ordered.map((language) => (
              <ZoneCodeChip
                key={language.code}
                code={language.code}
                highlight={language.code === defaultLanguageCode}
              />
            ))}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: t("columnActions"),
      cell: ({ row }) => (
        <ZoneActions id={row.original.id} name={row.original.name} />
      ),
    },
  ];

  if (isSalesman) {
    return columns.filter((col) => col.id !== "actions");
  }

  return columns;
  }, [isSalesman]);
}
