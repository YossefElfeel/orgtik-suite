import { redirect } from "next/navigation";

// SOS's own chat retired in favour of Chats (D-018): old links open Chats through the launcher.
export default function ChatMoved() {
  redirect("/go/hq");
}
