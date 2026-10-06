import { notFound } from "next/navigation";

// Any address inside a language that no page matches goes to that language's 404 (not-found.tsx
// beside the layout), instead of the app-wide English one.
export default function CatchAll() {
  notFound();
}
