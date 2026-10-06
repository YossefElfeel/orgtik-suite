import { Suspense } from "react";
import { PostsCalendar } from "@/components/pages/posts/calendar/PostsCalendar";

export default function CalendarPage() {
  return (
    <Suspense>
      <PostsCalendar />
    </Suspense>
  );
}
