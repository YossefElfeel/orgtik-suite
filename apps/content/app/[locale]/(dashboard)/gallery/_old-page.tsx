"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Plus, ImageIcon, Images } from "lucide-react";
import GalleryCard from "@/components/pages/gallery/GalleryCard";
import NewImageDialog from "@/components/pages/gallery/NewImageDialog";
import { motion } from "framer-motion";
import { useGetGalleryQuery } from "@/redux/features/gallery/galleryApi";
import { Skeleton } from "@/components/ui/skeleton";

interface GalleryItem {
  id: string;
  src: string;
  alt: string;
}

export default function ImageGallery() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const {
    data: gallery,
    isLoading,
    isFetching,
  } = useGetGalleryQuery({ page, limit });

  const galleryItemsLength = gallery?.data.items.length || 0;
  const totalItems = gallery?.data.meta.total || 0;
  const totalPages = Math.ceil(totalItems / limit);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLimitChange = (newLimit: string) => {
    setLimit(Number.parseInt(newLimit));
    setPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="p-4">
      {/* Header Section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-4"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Image Gallery
            </h1>
            <p className="text-muted-foreground">
              Manage your CRM images and media assets with ease
            </p>
          </div>
          <NewImageDialog>
            <Button className="rounded-lg">
              <Plus className="w-4 h-4 mr-2" />
              {galleryItemsLength ? "Upload Image" : "Upload your first image"}
            </Button>
          </NewImageDialog>
        </div>

        {/* Stats and Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              <span>{totalItems} total images</span>
            </div>
            {totalItems > 0 && (
              <span>
                Showing {(page - 1) * limit + 1}-
                {Math.min(page * limit, totalItems)} of {totalItems}
              </span>
            )}
          </div>

          {/* Items per page selector */}
          {totalItems > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Show:</span>
              <Select
                value={limit.toString()}
                onValueChange={handleLimitChange}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">per page</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Loading State */}
      {(isLoading || isFetching) && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {Array.from({ length: limit }).map((_, i) => (
            <Skeleton key={i} className="w-full h-48 bg-muted rounded-lg" />
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      {!isFetching && !isLoading && galleryItemsLength === 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <Images className="w-12 h-12 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No images yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Start building your gallery by uploading your first image. Add
            descriptions to keep everything accessible.
          </p>
        </motion.div>
      )}

      {/* Gallery Grid */}
      {!isFetching && !isLoading && galleryItemsLength > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {gallery?.data.items.map((item, ix) => (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 + ix * 0.1 }}
                key={item.id}
              >
                <GalleryCard item={item} />
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center"
            >
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, page - 1))}
                      className={
                        page === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {getPageNumbers().map((pageNum, index) => (
                    <PaginationItem key={index}>
                      {pageNum === "ellipsis" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          onClick={() => handlePageChange(pageNum as number)}
                          isActive={pageNum === page}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        handlePageChange(Math.min(totalPages, page + 1))
                      }
                      className={
                        page === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
