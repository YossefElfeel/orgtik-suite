"use client";
import { csvText } from "@orgtik/ui";
import { Button } from "@/components/ui/Primitives";
import { useChannel, useMessages, useUsers } from "@/store/hooks";
import { useT } from "@/lib/i18n";
export function ExportChannel({ channelId }: { channelId: string }) {
  const t = useT(), channel = useChannel(channelId), messages = useMessages(channelId), users = useUsers();
  return <Button size="sm" onClick={() => {
    const csv = csvText([["time", "author", "message"], ...messages.map(message => [message.createdAt, users.find(user => user.id === message.authorId)?.name || message.authorId, message.text])]);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${(channel?.name || "channel").replace(/[^\p{L}\p{N}_-]/gu, "-")}-history.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }}>{t("roadmap.exportChat", "Export channel history")}</Button>;
}
