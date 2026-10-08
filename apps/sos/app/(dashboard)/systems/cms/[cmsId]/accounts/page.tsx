import { redirect } from "next/navigation";

// The accepted internal CMS replaces this frozen screen; its original UI is preserved.
export default function RetiredCmsPage() {
  redirect("/go/website_manager?redirect=%2Fcontent%2Fpages");
}
