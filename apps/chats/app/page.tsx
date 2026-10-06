import { redirect } from "next/navigation";

/** Opening HQ lands on the Office: the first question is who is around. */
export default function Home() {
  redirect("/hq/office");
}
