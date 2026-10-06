"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { AlignLeft, AlignCenter, AlignRight, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageViewProps {
  node: {
    attrs: {
      src: string;
      alt?: string;
      title?: string;
      width?: string | number;
      height?: string | number;
      align?: "left" | "center" | "right";
    };
  };
  updateAttributes: (attributes: Record<string, any>) => void;
  selected: boolean;
  editor: any; // Tiptap editor instance
}

export function ImageView({
  node,
  updateAttributes,
  selected,
}: ImageViewProps) {
  const { src, alt, title, width, height, align } = node.attrs;
  const imageRef = useRef<HTMLImageElement>(null);
  const [currentWidth, setCurrentWidth] = useState<string | number>(
    width || "auto"
  );
  const [currentHeight, setCurrentHeight] = useState<string | number>(
    height || "auto"
  );

  const isResizingRef = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const startHeight = useRef(0);
  const latestWidthRef = useRef<string | number>(width || "auto"); // New ref for latest width
  const latestHeightRef = useRef<string | number>(height || "auto"); // New ref for latest height

  useEffect(() => {
    setCurrentWidth(width || "auto");
    setCurrentHeight(height || "auto");
    latestWidthRef.current = width || "auto"; // Initialize ref
    latestHeightRef.current = height || "auto"; // Initialize ref
  }, [width, height]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isResizingRef.current || !imageRef.current) return;

    const dx = event.clientX - startX.current;
    const newWidth = Math.max(50, startWidth.current + dx);

    // Calculate new height maintaining aspect ratio
    const aspectRatio = startHeight.current / startWidth.current;
    const newHeight = Math.max(50, newWidth * aspectRatio);

    setCurrentWidth(newWidth);
    setCurrentHeight(newHeight);
    latestWidthRef.current = newWidth; // Update ref synchronously
    latestHeightRef.current = newHeight; // Update ref synchronously
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isResizingRef.current) return;

    isResizingRef.current = false;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);

    // Update Tiptap attributes using the latest values from refs
    updateAttributes({
      width: latestWidthRef.current,
      height: latestHeightRef.current,
    });
  }, [handleMouseMove, updateAttributes]); // Removed currentWidth, currentHeight from dependencies

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault(); // Prevent default drag behavior
      if (!imageRef.current) return;

      isResizingRef.current = true;
      startX.current = e.clientX;
      startWidth.current = imageRef.current.offsetWidth;
      startHeight.current = imageRef.current.offsetHeight;

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [handleMouseMove, handleMouseUp]
  );

  const handleAlign = useCallback(
    (newAlign: "left" | "center" | "right") => {
      updateAttributes({ align: newAlign });
    },
    [updateAttributes]
  );

  const wrapperClasses = cn(
    "relative inline-block max-w-full",
    {
      "float-left mr-4": align === "left",
      "mx-auto block": align === "center",
      "float-right ml-4": align === "right",
    },
    {
      "rounded-lg ring-1 ring-primary ring-offset-2": selected,
    }
  );

  const imageStyle: React.CSSProperties = {
    width: currentWidth,
    height: currentHeight,
    objectFit: "contain",
    display: align === "center" ? "block" : "inline-block",
  };

  return (
    <NodeViewWrapper className={wrapperClasses} data-drag-handle>
      <img
        src={src || "/placeholder.svg"}
        alt={alt}
        title={title}
        ref={imageRef}
        style={imageStyle}
        className="max-w-full h-auto"
      />
      {selected && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background border rounded-md p-1 shadow-md z-10">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleAlign("left")}
            className={cn("h-6 w-6", { "bg-accent": align === "left" })}
            aria-label="Align left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleAlign("center")}
            className={cn("h-6 w-6", { "bg-accent": align === "center" })}
            aria-label="Align center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleAlign("right")}
            className={cn("h-6 w-6", { "bg-accent": align === "right" })}
            aria-label="Align right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <div
            className="absolute -right-2 -bottom-2 cursor-nwse-resize bg-primary text-primary-foreground rounded-full p-1 shadow-md"
            onMouseDown={handleMouseDown}
            aria-label="Resize image"
          >
            <Maximize2 className="h-3 w-3 -rotate-90" />
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}
