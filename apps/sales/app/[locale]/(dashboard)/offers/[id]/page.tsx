"use client";

import { use } from "react";
import OfferDetails from "@/components/pages/offers/OfferDetails";

export default function OfferDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <OfferDetails id={id} />;
}
