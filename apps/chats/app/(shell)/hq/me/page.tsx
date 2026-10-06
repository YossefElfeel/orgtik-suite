import { titled } from "@/lib/server-i18n";
import { MeScreen } from "@/features/shell/MeScreen";

export const generateMetadata = titled("page.me", "Me");

export default function MePage() {
  return <MeScreen />;
}
