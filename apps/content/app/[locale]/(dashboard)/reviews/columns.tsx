"use client";
import { useTranslations } from "next-intl";

import { ColumnDef } from "@tanstack/react-table";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format-date";
import { IReview } from "@/types/review";
import { DeleteDialog } from "@/components/shared/DeleteDialog";
import { useDeleteReviewMutation } from "@/redux/features/reviews/reviewsApi";
import { UpdatePublicStatusDialog } from "@/components/pages/reviews/UpdatePublicStatusDialog";
import { EditReviewDialog } from "@/components/pages/reviews/EditReviewDialog";

function StarRating({ rate }: { rate: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            rate >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

export const useColumns = (): ColumnDef<IReview>[] => {
  const t = useTranslations("ReviewsPage");
  const [deleteReview] = useDeleteReviewMutation();

  const columns: ColumnDef<IReview>[] = [
    {
      accessorKey: "id",
      header: "#",
      cell: ({ row }) => (
        <span className="font-medium text-gray-500">#{row.original.id}</span>
      ),
    },
    {
      accessorKey: "clientName",
      header: t("client"),
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-800">{row.original.clientName}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.clientTitle}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "reviewContent",
      header: t("review"),
      cell: ({ row }) => (
        <p className="max-w-xs truncate text-sm text-gray-600">
          {row.original.reviewContent}
        </p>
      ),
    },
    {
      accessorKey: "rate",
      header: t("rating"),
      cell: ({ row }) => <StarRating rate={row.original.rate} />,
    },
    {
      accessorKey: "isPublic",
      header: t("status"),
      cell: ({ row }) =>
        row.original.isPublic ? (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            {t("public")}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-red-500 bg-red-500/10">
            {t("hidden")}
          </Badge>
        ),
    },
    {
      accessorKey: "createdAt",
      header: t("date"),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: t("actions"),
      cell: ({ row }) => {
        const review = row.original;

        const handleDelete = async () => {
          try {
            await deleteReview(review.id).unwrap();
          } catch (e) {
            console.error(e);
          }
        };

        return (
          <div className="flex items-center gap-2">
            <EditReviewDialog review={review} />
            <DeleteDialog
              title={t("delete_confirm", { name: review.clientName })}
              description={t("delete_warning")}
              onConfirm={handleDelete}
            />
            <UpdatePublicStatusDialog
              reviewId={review.id}
              initialIsPublic={review.isPublic}
            />
          </div>
        );
      },
    },
  ];

  return columns;
};
