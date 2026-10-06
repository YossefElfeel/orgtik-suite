"use client";

import { use } from "react";
import SalesmanDetails from "@/components/pages/salesman/SalesmanDetails";

export default function SalesmanDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <SalesmanDetails id={id} />;
}
