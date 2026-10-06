import { titled } from "@/lib/server-i18n";
import { MeetingsView } from "@/features/meetings/MeetingsView";

export const generateMetadata = titled("page.meetings", "Meetings");

export default function MeetingsPage() {
  return <MeetingsView />;
}
