import { ChannelView } from "@/features/chat/ChannelView";

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ channelId: string }>;
}) {
  const { channelId } = await params;
  return <ChannelView channelId={channelId} />;
}
