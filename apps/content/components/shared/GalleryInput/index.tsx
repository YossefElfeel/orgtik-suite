"use client";

import type React from "react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Search,
  Grid,
  List,
  Check,
  X,
  Image as ImageIcon,
  ChevronDown,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type IGalleryItem } from "@somion/gallery";
import {
  useGetGalleryQuery,
  useGetMultipleGalleriesMutation,
} from "@/redux/features/gallery/galleryApi";
import Image from "next/image";

function GalleryInput({
  label,
  placeholder = "Select from gallery...",
  disabled = false,
  value,
  onChange,
  className,
  error,
  multiple = false,
}: {
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  value: number | number[] | undefined | null;
  onChange?: (item: IGalleryItem | IGalleryItem[] | null) => void;
  className?: string;
  error?: string;
  multiple?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedItems, setSelectedItems] = useState<IGalleryItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 8;
  const required = false;

  const {
    data: gallery,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetGalleryQuery({ page: currentPage, limit, search: searchTerm });

  const [getMultipleGalleries, { isLoading: isUploading }] =
    useGetMultipleGalleriesMutation();

  const totalPages = (gallery?.data?.meta?.totalPages as number) || 1;
  const hasNextPage = (gallery?.data?.meta?.hasNext as boolean) || false;
  const hasPrevPage = (gallery?.data?.meta?.hasPrev as boolean) || false;

  const handleSelect = (item: IGalleryItem) => {
    if (multiple) {
      const isSelected = selectedItems.some((i) => i.id === item.id);
      if (isSelected) {
        const newItems = selectedItems.filter((i) => i.id !== item.id);
        setSelectedItems(newItems);
        onChange?.(newItems.length > 0 ? newItems : null);
      } else {
        const newItems = [...selectedItems, item];
        setSelectedItems(newItems);
        onChange?.(newItems);
      }
    } else {
      onChange?.(item);
      setSelectedItems([item]);
      setIsOpen(false);
      setSearchTerm("");
      setCurrentPage(1);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(null);
    setSelectedItems([]);
  };

  const handleRemoveItem = (e: React.MouseEvent, itemId: number) => {
    e.stopPropagation();
    const newItems = selectedItems.filter((i) => i.id !== itemId);
    setSelectedItems(newItems);
    onChange?.(newItems.length > 0 ? newItems : null);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const goToNextPage = () => {
    if (hasNextPage) setCurrentPage(currentPage + 1);
  };

  const goToPrevPage = () => {
    if (hasPrevPage) setCurrentPage(currentPage - 1);
  };

  const handleConfirm = () => {
    setIsOpen(false);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const isItemSelected = (itemId: number) => {
    return selectedItems.some((i) => i.id === itemId);
  };

  useEffect(() => {
    const loadSelectedItems = async () => {
      if (!value) {
        setSelectedItems([]);
        return;
      }

      if (multiple && Array.isArray(value)) {
        // Multiple selection mode
        if (value.length === 0) {
          setSelectedItems([]);
          return;
        }

        try {
          const response = await getMultipleGalleries({ ids: value }).unwrap();
          if (response?.data) {
            setSelectedItems(response.data);
          }
        } catch (error) {
          console.error("Error loading selected images:", error);
          setSelectedItems([]);
        }
      } else if (!multiple && typeof value === "number") {
        // Single selection mode
        const foundItem = gallery?.data?.items.find(
          (item) => item.id === value
        );
        if (foundItem) {
          setSelectedItems([foundItem]);
        } else {
          // Try to fetch the single item if not in current page
          try {
            const response = await getMultipleGalleries({
              ids: [value],
            }).unwrap();
            if (response?.data && response.data.length > 0) {
              setSelectedItems([response.data[0]]);
            }
          } catch (error) {
            console.error("Error loading selected image:", error);
            setSelectedItems([]);
          }
        }
      }
    };

    loadSelectedItems();
  }, [value, multiple, gallery, getMultipleGalleries]);
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label
          className={cn(
            "font-normal",
            required && "after:content-['*'] after:ml-0.5 after:text-red-500"
          )}
        >
          {label}
        </Label>
      )}
      <div
        onClick={() => !disabled && setIsOpen(true)}
        className={cn(
          "flex flex-col items-center justify-center w-full h-full min-h-[150px] rounded-lg border-2 border-dashed border-gray-300 bg-white transition-all cursor-pointer",
          "hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          selectedItems.length > 0 ? "border-solid border-black/20" : ""
        )}
      >
        {selectedItems.length > 0 ? (
          <div className="flex flex-col items-center justify-center space-y-3 w-full p-4">
            {multiple ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-md">
                {selectedItems.map((item) => (
                  <div key={item.id} className="relative group">
                    <div className="aspect-square w-full overflow-hidden rounded-lg">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.alt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-center mt-2 text-gray-600 truncate">
                      {item.alt}
                    </p>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveItem(e, item.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <div className="relative group">
                  <div className="w-24 h-24 overflow-hidden rounded-lg">
                    <img
                      src={selectedItems[0].image || "/placeholder.svg"}
                      alt={selectedItems[0].alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-center text-gray-600 font-medium max-w-48">
                  {selectedItems[0].alt}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center">
              <div className="w-6 h-6 text-white font-bold text-xl leading-none">
                <Plus className="w-6 h-6" />
              </div>
            </div>
            <span className="text-gray-600 text-sm font-medium">
              Select image or video from here
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="flex flex-col w-full md:min-w-[900px]  max-w-6xl max-h-[80vh] p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-background to-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold">
                    Select from Gallery
                    {multiple && selectedItems.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({selectedItems.length} selected)
                      </span>
                    )}
                  </DialogTitle>
                  {!isLoading && !isFetching && gallery?.data && (
                    <p className="text-sm text-muted-foreground">
                      {gallery.data?.items?.length} items • Page {currentPage}{" "}
                      of {totalPages}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 py-4 bg-muted/20">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search gallery..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-12 h-12 text-base bg-background"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSearch("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col overflow-hidden flex-1">
            {isLoading || isFetching ? (
              <div className="flex flex-1 justify-center items-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : isError ? (
              <div className="text-center py-16 space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-destructive" />
                <h3 className="text-lg font-medium text-destructive">
                  Error loading gallery
                </h3>
                <Button variant="outline" onClick={() => refetch()}>
                  Try again
                </Button>
              </div>
            ) : gallery?.data?.items.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No items found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm
                    ? `No results for "${searchTerm}"`
                    : "No items available"}
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {gallery?.data?.items.map((item) => {
                    const selected = isItemSelected(item.id);
                    return (
                      <Card
                        onClick={() => handleSelect(item)}
                        key={item.id}
                        className={cn(
                          "group overflow-hidden border-black/20 hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-full cursor-pointer",
                          selected && "ring-2 ring-primary border-primary"
                        )}
                      >
                        <CardContent className="p-0">
                          <div className="relative w-full h-40 overflow-hidden">
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.alt}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-primaryColor/40 via-primaryColor/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            {selected && (
                              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1.5">
                                <Check className="w-4 h-4" />
                              </div>
                            )}
                          </div>

                          <div className="p-4">
                            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                              {item.alt}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
                {gallery?.data?.items.map((item) => {
                  const selected = isItemSelected(item.id);
                  return (
                    <Card
                      key={item.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-md",
                        selected &&
                        "ring-2 ring-primary border-primary bg-primary/5"
                      )}
                      onClick={() => handleSelect(item)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img
                              src={item.image || "/placeholder.svg"}
                              alt={item.alt}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            {selected && (
                              <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base truncate">
                              {item.alt}
                            </h3>
                          </div>
                          <Button
                            variant={selected ? "default" : "outline"}
                            size="sm"
                            className="min-w-20"
                          >
                            {selected ? "Selected" : "Select"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-6 py-3 border-t bg-background">
            <Button
              variant="ghost"
              size="sm"
              disabled={!hasPrevPage}
              onClick={goToPrevPage}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              {multiple && (
                <Button onClick={handleConfirm} size="sm">
                  Confirm Selection
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={!hasNextPage}
              onClick={goToNextPage}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
