import { CallScreen } from "@/features/meetings/CallScreen";

export default async function CallPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  return <CallScreen meetingId={meetingId} />;
}
