"use client";
import { use } from "react";
import { useTranslations } from "next-intl";
import { NoPermissionState, PageHeader } from "@orgtik/ui";
import ServiceOfferSheet from "@/components/sheets/ServiceOfferSheet";
import ServiceCatalogNavigation from "@/components/ServiceCatalogNavigation";
import { useServiceCatalogQuery } from "@/redux/features/services/servicesApi";
import { serviceForbidden, serviceRouteId } from "@/lib/service-catalog";
import { useRouter } from "@/i18n/routing";
export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) { const { id } = use(params), t = useTranslations("ServiceCatalog"), router = useRouter(), query = useServiceCatalogQuery(), decoded = serviceRouteId(id), offerId = query.data?.offers.find(offer => offer.id === decoded || offer.serviceId === decoded)?.id || decoded; return <div className="flex flex-col gap-5"><PageHeader title={t("editOffer")} /><ServiceCatalogNavigation />{serviceForbidden(query.error) ? <NoPermissionState title={t("internalOnly")} description={t("internalOnlyBody")} /> : <ServiceOfferSheet id={offerId} open onOpenChange={open => { if (!open) router.replace("/catalog"); }} onSaved={() => router.replace("/catalog")} />}</div>; }
