import { notFound } from "next/navigation";
import { ChatsPresentation } from "@/features/presentation/ChatsPresentation";

/** Separate fixtures, never a replacement for the authenticated Chats routes. */
export default function PresentationPage() {
  if (process.env.NODE_ENV !== "development" && process.env.NEXT_PUBLIC_DEMO_PANEL !== "1") notFound();
  return <ChatsPresentation />;
}
