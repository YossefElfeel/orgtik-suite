"use client";
import { useTranslations } from "next-intl";

import { useEffect, useState } from "react";
import { Pencil, Star, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ReusableDialog } from "@/components/shared/ReusableDialog/reusable-dialog";
import { useUpdateReviewMutation } from "@/redux/features/reviews/reviewsApi";
import { IReview, UpdateReviewDto } from "@/types/review";

interface EditReviewDialogProps {
  review: IReview;
}

export function EditReviewDialog({ review }: EditReviewDialogProps) {
  const t = useTranslations("ReviewsPage");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<UpdateReviewDto>({
    clientName: review.clientName,
    clientTitle: review.clientTitle,
    reviewContent: review.reviewContent,
    rate: review.rate,
    // isPublic: review.isPublic,
  });

  const [updateReview, { isLoading }] = useUpdateReviewMutation();

  useEffect(() => {
    if (open) {
      setForm({
        clientName: review.clientName,
        clientTitle: review.clientTitle,
        reviewContent: review.reviewContent,
        rate: review.rate,
        // isPublic: review.isPublic,
      });
    }
  }, [open, review]);

  const handleSave = async () => {
    try {
      await updateReview({ id: review.id, body: form }).unwrap();
      setOpen(false);
    } catch (_) {}
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={setOpen}
      title={t("edit_dialog_title")}
      description={t("edit_dialog_desc")}
      size="md"
      trigger={
        <Button variant="outline" size="icon">
          <Pencil className="w-4 h-4" />
        </Button>
      }
      onSuccess={handleSave}
      onCancel={() => setOpen(false)}
      onSuccessText={t("save_changes_btn")}
      onCancelText={t("cancel")}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        {/* Client Name */}
        <div className="space-y-1.5">
          <Label htmlFor="clientName">{t("client_name")}</Label>
          <Input
            id="clientName"
            value={form.clientName ?? ""}
            onChange={(e) =>
              setForm((p) => ({ ...p, clientName: e.target.value }))
            }
            placeholder={t("client_name_placeholder")}
          />
        </div>

        {/* Client Title */}
        <div className="space-y-1.5">
          <Label htmlFor="clientTitle">{t("client_title")}</Label>
          <Input
            id="clientTitle"
            value={form.clientTitle ?? ""}
            onChange={(e) =>
              setForm((p) => ({ ...p, clientTitle: e.target.value }))
            }
            placeholder={t("client_title_placeholder_edit")}
          />
        </div>

        {/* Review Content */}
        <div className="space-y-1.5">
          <Label htmlFor="reviewContent">{t("review_content_label")}</Label>
          <Textarea
            id="reviewContent"
            rows={4}
            value={form.reviewContent ?? ""}
            onChange={(e) =>
              setForm((p) => ({ ...p, reviewContent: e.target.value }))
            }
            placeholder={t("review_content_placeholder_edit")}
          />
        </div>

        {/* Rating */}
        <div className="space-y-1.5">
          <Label>{t("rating_label")}</Label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setForm((p) => ({ ...p, rate: star }))}
                className="focus:outline-none"
              >
                <Star
                  className={`w-6 h-6 transition-colors ${
                    (form.rate ?? 0) >= star
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-muted-foreground">
              {form.rate ?? 0} / 5
            </span>
          </div>
        </div>

        {/* <div className="flex items-center gap-3 rounded-lg border p-3">
          <Checkbox
            id="isPublic"
            checked={form.isPublic ?? false}
            onCheckedChange={(checked) =>
              setForm((p) => ({ ...p, isPublic: checked === true }))
            }
          />
          <div>
            <label htmlFor="isPublic" className="text-sm font-medium cursor-pointer">
              Visible to public
            </label>
            <p className="text-xs text-muted-foreground">
              Show this review on the website
            </p>
          </div>
        </div> */}
      </div>
    </ReusableDialog>
  );
}
