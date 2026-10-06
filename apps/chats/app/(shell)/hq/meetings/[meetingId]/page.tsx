import { MeetingDetail } from "@/features/meetings/MeetingsView";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  return <MeetingDetail meetingId={meetingId} />;
}
