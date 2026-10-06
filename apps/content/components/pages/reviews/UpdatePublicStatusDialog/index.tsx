"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { useUpdateReviewMutation } from "@/redux/features/reviews/reviewsApi";
import { Loader2 } from "lucide-react";

interface UpdatePublicStatusProps {
  reviewId: number;
  initialIsPublic?: boolean;
}

export function UpdatePublicStatusDialog({
  reviewId,
  initialIsPublic,
}: UpdatePublicStatusProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [updateReview, { isLoading }] = useUpdateReviewMutation();

  useEffect(() => {
    setIsPublic(initialIsPublic);
  }, [initialIsPublic]);

  const handleToggle = async (nextValue: boolean) => {
    setIsPublic(nextValue);

    try {
      await updateReview({
        id: reviewId,
        body: { isPublic: nextValue },
      }).unwrap();
    } catch (error) {
      setIsPublic(!nextValue);
    }
  };

  return (
    <div className="flex items-center gap-2 p-[10px] border rounded-lg">
      <Switch
        id={`public-mode-${reviewId}`}
        checked={isPublic}
        onCheckedChange={handleToggle}
        disabled={isLoading}
      />
      {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
    </div>
  );
}
