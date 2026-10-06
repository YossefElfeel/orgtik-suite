import { redirect } from "next/navigation";

// The suite's apps are /systems itself now (FS-SOS-9); old links keep working.
export default function InternalSystems() {
  redirect("/systems");
}
