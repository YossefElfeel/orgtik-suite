"use client";

import { useParams } from "next/navigation";
import { PostDetailsView } from "@/components/pages/posts/details/PostDetailsView";

export default function PostDetailsPage() {
  const { id } = useParams<{ id: string }>();
  return <PostDetailsView key={id} postId={id} />;
}
