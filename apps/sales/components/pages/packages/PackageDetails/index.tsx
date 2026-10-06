"use client";

import { Icon } from "@iconify/react";
import type { PackageDetail } from "@/types/packages";
import { useTranslations } from "next-intl";
import MainHeader from "@/components/shared/MainHeader";
import { DeleteDialog } from "@/components/dialogs/shared/DeleteDialog";

import PackageManagement from "@/components/dialogs/packages/PackageManagement";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/shared/SectionCard";
import PackageStats from "@/components/pages/packages/PackageStats";
import PackagePricingSummary from "@/components/pages/packages/PackagePricingSummary";
import PackagePlansList from "@/components/pages/packages/PackagePlansList";

type Props = {
  packageDetail: PackageDetail;
};

import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import { useDeletePackageMutation } from "@/redux/features/packages/packagesApi";
import { useRouter } from "@/i18n/routing";
import { useRole } from "@/hooks/useRole";

function DeletePackageButton({ id, name }: { id: string; name: string }) {
  const [deletePackage, { isLoading }] = useDeletePackageMutation();
  const tCommon = useTranslations("common");

  return (
    <DeleteDialog
      title={name}
      onConfirm={async () => {
        await deletePackage(id).unwrap();
      }}
      trigger={
        <Button
          variant="outline"
          type="button"
          disabled={isLoading}
          className="border-red/20 text-red hover:bg-red/5 hover:text-red"
        >
          <Icon icon="solar:trash-bin-trash-linear" />
          {tCommon("delete")}
        </Button>
      }
    />
  );
}

export default function PackageDetails({ packageDetail }: Props) {
  const { isSalesman } = useRole();
  const displayText = useCatalogDisplayText();
  const t = useTranslations("packages");
  const tCommon = useTranslations("common");

  return (
    <section className="flex flex-col gap-6">
      <MainHeader
        title={displayText(packageDetail.name)}
        backLink={{
          href: "/packages",
          label: t("backToPackages", { fallback: "Back to Packages" }),
        }}
        subChildren={
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="ghost-green" className="min-w-0 uppercase h-[22px] px-2 text-[10px]">
              {packageDetail.status ? packageDetail.status : tCommon("active")}
            </Badge>
            {Array.from(
              new Set(
                packageDetail.plans
                  .map((plan) => displayText(plan.category?.name))
                  .filter((category) => category !== "—"),
              ),
            ).map((cat, idx) => (
              <div key={cat} className="flex items-center text-xs text-muted-foreground font-medium">
                {idx > 0 && <span className="mx-2 text-[10px]">•</span>}
                {cat}
              </div>
            ))}
          </div>
        }
      >
        {!isSalesman && (
          <div className="flex flex-wrap items-center gap-2">
            <DeletePackageButton
              id={packageDetail.id}
              name={displayText(packageDetail.name)}
            />
            <PackageManagement
              id={packageDetail.id}
              trigger={
                <Button type="button" icon="solar:pen-linear">
                  {t("editPackage", { fallback: "Edit Package" })}
                </Button>
              }
            />
          </div>
        )}
      </MainHeader>

      <PackageStats packageDetail={packageDetail} />

      <SectionCard title={tCommon("description")}>
        <p className="text-sm leading-6 text-secondary">
          {displayText(packageDetail.description)}
        </p>
      </SectionCard>

      <PackagePricingSummary packageDetail={packageDetail} />
      <PackagePlansList packageDetail={packageDetail} />
    </section>
  );
}
