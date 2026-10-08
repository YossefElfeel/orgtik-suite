"use client";

import { notFound } from "next/navigation";
import PackageDetails from "@/components/pages/packages/PackageDetails";
import { useGetPackageByIdQuery } from "@/redux/features/packages/packagesApi";
import { pickDisplayData } from "@/lib/api-display";
import { use } from "react";
import { Loader } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

export default function PackageDetailsPage({ params }: Props) {
  const { id } = use(params);
  const { data, isLoading, error } = useGetPackageByIdQuery(id);
  const packageDetail = pickDisplayData(data);

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader className="size-6 animate-spin text-secondary" />
      </div>
    );
  }
  if (error || !packageDetail) {
    notFound();
  }

  return <PackageDetails packageDetail={packageDetail} />;
}
