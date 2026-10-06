"use client"

import { useAppSelector } from "@/redux/app/hooks"
import { SoSBar } from "@somion/sos-bar"
import { useLocale } from "next-intl";

function SoSBarWrapper() {
    const token = useAppSelector((state) => state.auth.token) as string;
    const locale = useLocale() as string;

    return <SoSBar token={token} locale={locale} />
}

export default SoSBarWrapper; 