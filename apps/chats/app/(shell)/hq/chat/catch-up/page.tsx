import { titled } from "@/lib/server-i18n";
import { CatchUpView } from "@/features/chat/CatchUpView";

export const generateMetadata = titled("page.catchUp", "Catch up");

export default function CatchUpPage() {
  return <CatchUpView />;
}
