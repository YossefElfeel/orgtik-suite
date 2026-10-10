import { AccountProduct } from "@/components/account/AccountProduct";
import { notFound } from "next/navigation";
export default async function ProductPage({ params }: { params: Promise<{ section: string }> }) { const { section } = await params; if (!["help", "status", "changelog", "announcements", "feedback"].includes(section)) notFound(); return <AccountProduct active={section} />; }
