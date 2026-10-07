import { getTranslations } from "next-intl/server";
import AuthLayout from "@/app/auth/layout";
import { WorkspaceInvitation } from "@/components/invitations/WorkspaceInvitation";

export async function generateMetadata() { return { title: (await getTranslations("WorkspaceInvite"))("pageTitle") }; }
export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <AuthLayout><WorkspaceInvitation token={token} /></AuthLayout>;
}
