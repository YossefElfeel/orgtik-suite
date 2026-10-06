import { redirect } from "@/i18n/routing";
import { getDefaultCampaignNewPath } from "@/lib/campaigns/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

async function page({ params }: Props) {
  const { locale } = await params;
  redirect({ href: getDefaultCampaignNewPath(), locale });
}

export default page;
