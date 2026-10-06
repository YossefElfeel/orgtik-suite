"use client";
import { ArrowsCounterClockwise as RefreshCcw, DotsThreeVertical as MoreVertical, Minus, Plus } from "@phosphor-icons/react";

import React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ConfirmDialog,
  ReusableDialog,
} from "@/components/shared/ReusableDialog/reusable-dialog";
import { cn } from "@/lib/utils";
import { useFormatter, useTranslations } from "next-intl";

export type OrgChartItem = {
  id: string;
  parentId?: string | null;
  name: string;
  role: string;
  avatarUrl?: string | null;
};

export type OrgChartProps = {
  items: OrgChartItem[];
  className?: string;
  initialScale?: number;
};

type PositionedNode = {
  item: OrgChartItem;
  depth: number;
  xCenter: number;
  yTop: number;
  children: string[];
};

const DEFAULT_LAYOUT = {
  nodeWidth: 320,
  nodeHeight: 64,
  levelGap: 138,
  horizontalStep: 380, // distance between leaf centers
  paddingX: 56,
  paddingY: 22,
  connectorStroke: "var(--ot-line-strong)",
};

/** Pixels from the top of the viewport to the chart’s world origin when fitting the view. */
const VIEWPORT_TOP_INSET = 24;

/** Bottom breathing room when fitting height (above rounded clip / controls). */
const VIEWPORT_BOTTOM_INSET = 20;

/** Fraction of width/height used when computing scale-to-fit (leave a small margin). */
const FIT_VIEW_PADDING = 0.94;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "U";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase();
}

export function OrgChart({
  items,
  className,
  initialScale = 1,
}: OrgChartProps) {
  const t = useTranslations("employees.orgChart");
  const format = useFormatter();
  const [scale, setScale] = React.useState(initialScale);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  // True while the view is exactly the fitted one: "Fit chart to view" would change nothing then.
  const [fitted, setFitted] = React.useState(true);
  const [isDragging, setIsDragging] = React.useState(false);
  const [localItems, setLocalItems] = React.useState(items);
  const viewportRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const scaleRef = React.useRef(scale);
  const panRef = React.useRef(pan);
  React.useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);
  React.useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  const clampScale = React.useCallback((next: number) => {
    return Math.min(1.6, Math.max(0.12, next));
  }, []);

  const [showOpenId, setShowOpenId] = React.useState<string | null>(null);
  const [assignOpenId, setAssignOpenId] = React.useState<string | null>(null);
  const [assignSelectedManagerId, setAssignSelectedManagerId] = React.useState<
    string | null
  >(null);
  const [removeConfirmId, setRemoveConfirmId] = React.useState<string | null>(
    null,
  );
  const [menuOpenId, setMenuOpenId] = React.useState<string | null>(null);

  const isAnyDialogOpen =
    showOpenId !== null || assignOpenId !== null || removeConfirmId !== null;

  const itemById = React.useMemo(
    () => new Map(localItems.map((it) => [it.id, it])),
    [localItems],
  );

  const getDescendants = React.useCallback(
    (rootId: string) => {
      const childrenById = new Map<string, string[]>();
      for (const it of localItems) {
        if (!it.parentId) continue;
        const list = childrenById.get(it.parentId) ?? [];
        list.push(it.id);
        childrenById.set(it.parentId, list);
      }

      const visited = new Set<string>();
      const stack = [...(childrenById.get(rootId) ?? [])];
      while (stack.length) {
        const id = stack.pop()!;
        if (visited.has(id)) continue;
        visited.add(id);
        const next = childrenById.get(id) ?? [];
        for (const child of next) stack.push(child);
      }
      return visited;
    },
    [localItems],
  );

  const descendantIds = React.useMemo(() => {
    if (!assignOpenId) return new Set<string>();
    return getDescendants(assignOpenId);
  }, [assignOpenId, getDescendants]);

  const assignManagerOptions = React.useMemo(() => {
    if (!assignOpenId) return [];
    return localItems.filter(
      (it) => it.id !== assignOpenId && !descendantIds.has(it.id),
    );
  }, [assignOpenId, localItems, descendantIds]);

  React.useEffect(() => {
    if (!assignOpenId) {
      setAssignSelectedManagerId(null);
      return;
    }

    const currentParentId = itemById.get(assignOpenId)?.parentId ?? null;
    const currentValid =
      currentParentId &&
      assignManagerOptions.some((m) => m.id === currentParentId);

    const next = currentValid
      ? currentParentId
      : (assignManagerOptions[0]?.id ?? null);
    setAssignSelectedManagerId(next);
  }, [assignOpenId, itemById, assignManagerOptions]);

  const layout = React.useMemo(() => {
    if (!localItems?.length) {
      return {
        nodeMap: new Map<string, PositionedNode>(),
        connectors: [] as Array<{
          parentId: string;
          childId: string;
          path: string;
        }>,
        pluses: [] as Array<{ parentId: string; x: number; y: number }>,
        canvasWidth: 800,
        canvasHeight: 500,
      };
    }

    const indexById = new Map<string, { item: OrgChartItem; order: number }>();
    localItems.forEach((it, order) =>
      indexById.set(it.id, { item: it, order }),
    );

    const childrenById = new Map<string, string[]>();
    for (const it of localItems) {
      const parentId = it.parentId ?? null;
      if (!parentId) continue;
      if (!indexById.has(parentId)) continue;
      const arr = childrenById.get(parentId) ?? [];
      arr.push(it.id);
      childrenById.set(parentId, arr);
    }

    for (const [id, arr] of childrenById) {
      arr.sort(
        (a, b) =>
          (indexById.get(a)!.order ?? 0) - (indexById.get(b)!.order ?? 0),
      );
      childrenById.set(id, arr);
    }

    const roots = localItems
      .filter((it) => !it.parentId || !indexById.has(it.parentId))
      .map((it) => it.id)
      .sort(
        (a, b) =>
          (indexById.get(a)!.order ?? 0) - (indexById.get(b)!.order ?? 0),
      );

    const depthById = new Map<string, number>();
    const visiting = new Set<string>();
    const computeDepth = (id: string, depth: number) => {
      if (visiting.has(id)) return;
      visiting.add(id);
      depthById.set(id, depth);
      const children = childrenById.get(id) ?? [];
      for (const childId of children) computeDepth(childId, depth + 1);
      visiting.delete(id);
    };

    roots.forEach((r) => computeDepth(r, 0));

    // Assign x centers by leaf order, internal nodes centered between their children.
    let leafCursor = 0;
    const xCenterById = new Map<string, number>();

    const assignX = (id: string): number => {
      const children = childrenById.get(id) ?? [];
      if (!children.length) {
        const x = leafCursor * DEFAULT_LAYOUT.horizontalStep;
        leafCursor += 1;
        xCenterById.set(id, x);
        return x;
      }

      const childXs = children.map((childId) => assignX(childId));
      const minX = Math.min(...childXs);
      const maxX = Math.max(...childXs);
      const x = (minX + maxX) / 2;
      xCenterById.set(id, x);
      return x;
    };

    roots.forEach((r) => assignX(r));

    const allNodeIds = Array.from(indexById.keys());
    const minX = Math.min(...allNodeIds.map((id) => xCenterById.get(id) ?? 0));
    const maxX = Math.max(...allNodeIds.map((id) => xCenterById.get(id) ?? 0));
    const maxDepth = Math.max(
      ...allNodeIds.map((id) => depthById.get(id) ?? 0),
    );

    const totalWidth = maxX - minX + DEFAULT_LAYOUT.nodeWidth;
    const canvasWidth = totalWidth + DEFAULT_LAYOUT.paddingX * 2;
    const canvasHeight =
      maxDepth * DEFAULT_LAYOUT.levelGap +
      DEFAULT_LAYOUT.nodeHeight +
      DEFAULT_LAYOUT.paddingY * 2;

    const shiftX =
      DEFAULT_LAYOUT.paddingX + DEFAULT_LAYOUT.nodeWidth / 2 - minX;
    const nodeMap = new Map<string, PositionedNode>();

    for (const id of allNodeIds) {
      const entry = indexById.get(id);
      if (!entry) continue;
      const depth = depthById.get(id) ?? 0;
      const xCenter = (xCenterById.get(id) ?? 0) + shiftX;
      const yTop = DEFAULT_LAYOUT.paddingY + depth * DEFAULT_LAYOUT.levelGap;
      nodeMap.set(id, {
        item: entry.item,
        depth,
        xCenter,
        yTop,
        children: childrenById.get(id) ?? [],
      });
    }

    const connectors: Array<{
      parentId: string;
      childId: string;
      path: string;
    }> = [];
    const pluses: Array<{ parentId: string; x: number; y: number }> = [];

    for (const id of allNodeIds) {
      const parentNode = nodeMap.get(id);
      if (!parentNode) continue;
      const children = parentNode.children;
      if (!children.length) continue;

      const parentBottomY = parentNode.yTop + DEFAULT_LAYOUT.nodeHeight;
      const childDepth = parentNode.depth + 1;

      // In this simplified layout, all direct children share the same yTop.
      const childYTop =
        DEFAULT_LAYOUT.paddingY + childDepth * DEFAULT_LAYOUT.levelGap;
      const junctionY = (parentBottomY + childYTop) / 2;

      // One plus per parent trunk.
      pluses.push({
        parentId: id,
        x: parentNode.xCenter,
        y: junctionY,
      });

      for (const childId of children) {
        const childNode = nodeMap.get(childId);
        if (!childNode) continue;

        const childTopY = childNode.yTop;
        const childCenterX = childNode.xCenter;

        const d = [
          // trunk down
          `M ${parentNode.xCenter} ${parentBottomY}`,
          `L ${parentNode.xCenter} ${junctionY}`,
          // horizontal at junction
          `L ${childCenterX} ${junctionY}`,
          // down into child
          `L ${childCenterX} ${childTopY}`,
        ].join(" ");

        connectors.push({ parentId: id, childId, path: d });
      }
    }

    return { nodeMap, connectors, pluses, canvasWidth, canvasHeight };
  }, [localItems]);

  const topCenteredPan = React.useCallback(
    (viewportWidth: number, scaleVal: number) => ({
      x: (viewportWidth - layout.canvasWidth * scaleVal) / 2,
      y: VIEWPORT_TOP_INSET,
    }),
    [layout.canvasWidth],
  );

  const computeFitScale = React.useCallback(
    (vw: number, vh: number) => {
      const cw = layout.canvasWidth;
      const ch = layout.canvasHeight;
      if (cw <= 0 || ch <= 0) return clampScale(initialScale);
      const availW = vw * FIT_VIEW_PADDING;
      const availH =
        Math.max(48, vh - VIEWPORT_TOP_INSET - VIEWPORT_BOTTOM_INSET) *
        FIT_VIEW_PADDING;
      const uncapped = Math.min(availW / cw, availH / ch);
      return clampScale(Math.min(initialScale, uncapped));
    },
    [layout.canvasWidth, layout.canvasHeight, clampScale, initialScale],
  );

  const applyFitView = React.useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const s = computeFitScale(rect.width, rect.height);
    setScale(s);
    setPan(topCenteredPan(rect.width, s));
    setFitted(true);
  }, [computeFitScale, topCenteredPan]);

  // Fit all nodes in the viewport (zoom out as needed), top-centered; refit on resize.
  React.useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    applyFitView();
    const ro = new ResizeObserver(() => applyFitView());
    ro.observe(el);
    return () => ro.disconnect();
  }, [layout.canvasWidth, layout.canvasHeight, applyFitView]);

  const zoomAt = React.useCallback(
    (nextScale: number, anchor: { x: number; y: number }) => {
      const currentScale = scaleRef.current;
      const currentPan = panRef.current;
      const clamped = clampScale(nextScale);
      if (clamped === currentScale) return;

      // World point under the anchor before zooming:
      const worldX = (anchor.x - currentPan.x) / currentScale;
      const worldY = (anchor.y - currentPan.y) / currentScale;

      setScale(clamped);
      setFitted(false);
      setPan({
        x: anchor.x - worldX * clamped,
        y: anchor.y - worldY * clamped,
      });
    },
    [clampScale],
  );

  // Drag (pan) state — window listeners are used so pan works when the pointer
  // target is a node/card (setPointerCapture on the viewport is not valid then).
  const dragRef = React.useRef<{
    dragging: boolean;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);
  const endPanWindowListenersRef = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    return () => {
      endPanWindowListenersRef.current?.();
      endPanWindowListenersRef.current = null;
      dragRef.current = null;
    };
  }, []);

  const showItem = showOpenId ? (itemById.get(showOpenId) ?? null) : null;
  const assignItem = assignOpenId ? (itemById.get(assignOpenId) ?? null) : null;
  const removeItem = removeConfirmId
    ? (itemById.get(removeConfirmId) ?? null)
    : null;

  return (
    <div
      className={className}
      style={{
        position: "relative",
      }}
    >
      <div
        ref={viewportRef}
        className={cn(
          "relative overflow-hidden rounded-2xl h-full border border-line bg-sunken",
          isDragging ? "cursor-grabbing" : "cursor-grab",
          className,
        )}
        style={{ touchAction: "none" }}
        onWheel={(e) => {
          // Canvas zoom around the cursor position.
          if (isAnyDialogOpen) return;
          e.preventDefault();
          const el = viewportRef.current;
          if (!el) return;

          const currentScale = scaleRef.current;
          const factor = e.deltaY < 0 ? 1.12 : 0.89;
          const nextScale = clampScale(currentScale * factor);
          if (nextScale === currentScale) return;

          const rect = el.getBoundingClientRect();
          const cursor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
          zoomAt(nextScale, cursor);
        }}
        onPointerDown={(e) => {
          const target = e.target as HTMLElement;
          if (isAnyDialogOpen) return;
          if (menuOpenId) return;
          if (target.closest("[data-orgchart-no-pan]")) return;

          // Only left button for mouse.
          if (e.pointerType === "mouse" && e.button !== 0) return;

          if (!viewportRef.current) return;

          endPanWindowListenersRef.current?.();
          endPanWindowListenersRef.current = null;

          const pointerId = e.pointerId;
          dragRef.current = {
            dragging: true,
            pointerId,
            startClientX: e.clientX,
            startClientY: e.clientY,
            startPanX: panRef.current.x,
            startPanY: panRef.current.y,
          };
          setIsDragging(true);

          const onWindowPointerMove = (ev: PointerEvent) => {
            if (!dragRef.current?.dragging || ev.pointerId !== pointerId)
              return;
            const nextX =
              dragRef.current.startPanX +
              (ev.clientX - dragRef.current.startClientX);
            const nextY =
              dragRef.current.startPanY +
              (ev.clientY - dragRef.current.startClientY);
            setPan({ x: nextX, y: nextY });
            setFitted(false);
          };
          const endPan = (ev: PointerEvent) => {
            if (ev.pointerId !== pointerId) return;
            window.removeEventListener("pointermove", onWindowPointerMove);
            window.removeEventListener("pointerup", endPan);
            window.removeEventListener("pointercancel", endPan);
            endPanWindowListenersRef.current = null;
            dragRef.current = null;
            setIsDragging(false);
          };
          window.addEventListener("pointermove", onWindowPointerMove);
          window.addEventListener("pointerup", endPan);
          window.addEventListener("pointercancel", endPan);
          endPanWindowListenersRef.current = () => {
            window.removeEventListener("pointermove", onWindowPointerMove);
            window.removeEventListener("pointerup", endPan);
            window.removeEventListener("pointercancel", endPan);
          };
        }}
        onDoubleClick={() => {
          applyFitView();
        }}
      >
        {/* Dotted background fixed to the viewport (covers full visible area while panning/zooming) */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(rgba(134,153,181,0.25) 1.2px, transparent 1.2px)",
            backgroundSize: "18px 18px",
            backgroundRepeat: "repeat",
          }}
        />

        {/* Controls (not scaled) */}
        <div
          className="absolute inset-s-4 bottom-4 z-10 flex flex-col gap-2"
          data-orgchart-no-pan
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              const el = viewportRef.current;
              if (!el) {
                setScale((s) => clampScale(Math.round((s - 0.1) * 100) / 100));
                setFitted(false);
                return;
              }
              const rect = el.getBoundingClientRect();
              zoomAt(Math.round((scaleRef.current - 0.1) * 100) / 100, {
                x: rect.width / 2,
                y: rect.height / 2,
              });
            }}
            // Off at the limit: pressing it there changed nothing (HR-031).
            disabled={scale <= 0.12}
            className="h-9 w-9 rounded-full border border-line bg-raised/70 text-fg-muted hover:bg-raised"
            aria-label={t("zoomOut")}
          >
            <Minus className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              const el = viewportRef.current;
              if (!el) {
                setScale((s) => clampScale(Math.round((s + 0.1) * 100) / 100));
                setFitted(false);
                return;
              }
              const rect = el.getBoundingClientRect();
              zoomAt(Math.round((scaleRef.current + 0.1) * 100) / 100, {
                x: rect.width / 2,
                y: rect.height / 2,
              });
            }}
            disabled={scale >= 1.6}
            className="h-9 w-9 rounded-full border border-line bg-raised/70 text-fg-muted hover:bg-raised"
            aria-label={t("zoomIn")}
          >
            <Plus className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              applyFitView();
            }}
            // Off while the chart is already fitted: pressing it then changed nothing.
            disabled={fitted}
            className="h-9 w-9 rounded-full border border-line bg-raised/70 text-fg-muted hover:bg-raised"
            aria-label={t("fitView")}
          >
            <RefreshCcw className="h-5 w-5" />
          </Button>
          {/* The zoom level, so every zoom press has a visible (and announced) answer. */}
          <output
            aria-live="polite"
            aria-label={t("zoomLevel")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-raised/70 text-[11px] font-medium tabular-nums text-fg-muted"
          >
            {format.number(scale, { style: "percent", maximumFractionDigits: 0 })}
          </output>
        </div>

        <div
          className="relative isolate"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: layout.canvasWidth,
            height: layout.canvasHeight,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          {/* Full-chart hit target so pan works on connectors / empty gaps (SVG is pointer-events-none). */}
          <div
            className="absolute inset-0 z-0"
            aria-hidden
            style={{ touchAction: "none" }}
          />

          {/* Connectors */}
          <svg
            className="pointer-events-none absolute inset-0 z-1"
            width={layout.canvasWidth}
            height={layout.canvasHeight}
          >
            {layout.connectors.map((c) => (
              <path
                key={`${c.parentId}-${c.childId}`}
                d={c.path}
                fill="none"
                stroke={DEFAULT_LAYOUT.connectorStroke}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ pointerEvents: "none" }}
              />
            ))}
          </svg>

          {/* Plus buttons */}
          {layout.pluses.map((p) => (
            <div
              key={`plus-${p.parentId}`}
              className="absolute z-2"
              style={{
                left: p.x - 10,
                top: p.y - 10,
                width: 20,
                height: 20,
                borderRadius: 9999,
                background: "white",
                border: "1px solid var(--ot-success-fg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
              }}
            >
              <span
                style={{ color: "var(--ot-success-fg)", fontWeight: 700, lineHeight: 1 }}
              >
                <Plus className="size-3" />
              </span>
            </div>
          ))}

          {/* Nodes */}
          {Array.from(layout.nodeMap.values()).map((node) => (
            <div
              key={node.item.id}
              className="absolute z-3"
              draggable={false}
              onDragStart={(e) => {
                // Prevent browser "ghost" dragging from the whole card.
                e.preventDefault();
              }}
              style={{
                left: node.xCenter - DEFAULT_LAYOUT.nodeWidth / 2,
                top: node.yTop,
                width: DEFAULT_LAYOUT.nodeWidth,
                height: DEFAULT_LAYOUT.nodeHeight,
              }}
            >
              <div className="relative flex items-center gap-3 rounded-xl bg-raised border border-line shadow-sm px-4 h-[64px] select-none">
                <Avatar size="lg" className="border border-raised shadow-sm">
                  <AvatarImage
                    src={node.item.avatarUrl ?? undefined}
                    alt={node.item.name}
                    draggable={false}
                    onDragStart={(e) => {
                      // Prevent browser "ghost image" dragging from avatars.
                      e.preventDefault();
                    }}
                  />
                  <AvatarFallback>{getInitials(node.item.name)}</AvatarFallback>
                </Avatar>

                <div className="flex flex-col min-w-0">
                  <div className="text-sm font-semibold text-fg truncate">
                    <bdi>{node.item.name}</bdi>
                  </div>
                  <div className="text-[13px] text-fg-subtle truncate">
                    <bdi>{node.item.role}</bdi>
                  </div>
                </div>

                {/* <DropdownMenu
                  open={menuOpenId === node.item.id}
                  onOpenChange={(open) => {
                    setMenuOpenId(open ? node.item.id : null);
                  }}
                >
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        data-orgchart-no-pan
                        className="absolute end-2 top-1/2 -translate-y-1/2 h-8 w-8 text-fg-subtle hover:bg-sunken"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="start" sideOffset={15} className="w-56">
                    <DropdownMenuItem
                      onClick={() => {
                        setMenuOpenId(null);
                        setShowOpenId(node.item.id);
                      }}
                    >
                      Show
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setMenuOpenId(null);
                        setAssignOpenId(node.item.id);
                      }}
                    >
                      Assign manager
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        setMenuOpenId(null);
                        setRemoveConfirmId(node.item.id);
                      }}
                    >
                      Remove from management
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu> */}
              </div>
            </div>
          ))}
        </div>

        {/* Dialogs */}
        <ReusableDialog
          title={t("details.title")}
          description={showItem?.role}
          open={showOpenId !== null}
          onOpenChange={(open) => {
            if (!open) setShowOpenId(null);
          }}
          size="sm"
        >
          {showItem ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar size="lg" className="border border-raised shadow-sm">
                  <AvatarImage
                    src={showItem.avatarUrl ?? undefined}
                    alt={showItem.name}
                  />
                  <AvatarFallback>{getInitials(showItem.name)}</AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <div className="font-semibold text-fg truncate">
                    {showItem.name}
                  </div>
                  <div className="text-sm text-fg-subtle truncate">
                    {showItem.role}
                  </div>
                </div>
              </div>

              <div className="text-sm text-fg-muted">
                {t("details.manager")}:{" "}
                {showItem.parentId
                  ? (itemById.get(showItem.parentId)?.name ?? t("details.none"))
                  : t("details.none")}
              </div>
            </div>
          ) : null}
        </ReusableDialog>

        <ReusableDialog
          title={t("assign.title")}
          description={
            assignItem
              ? t("assign.description", { name: assignItem.name })
              : undefined
          }
          open={assignOpenId !== null}
          onOpenChange={(open) => {
            if (!open) setAssignOpenId(null);
          }}
          size="sm"
          footer={
            <div className="flex w-full justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAssignOpenId(null)}
              >
                {t("assign.cancel")}
              </Button>
              <Button
                type="button"
                disabled={!assignSelectedManagerId}
                onClick={() => {
                  if (!assignOpenId || !assignSelectedManagerId) return;
                  setLocalItems((prev) =>
                    prev.map((it) =>
                      it.id === assignOpenId
                        ? { ...it, parentId: assignSelectedManagerId }
                        : it,
                    ),
                  );
                  setAssignOpenId(null);
                }}
              >
                {t("assign.submit")}
              </Button>
            </div>
          }
        >
          {assignItem ? (
            <div className="space-y-4">
              <div className="text-sm text-fg-muted">
                {t("assign.willReportTo", { name: assignItem.name })}
              </div>

              {assignManagerOptions.length ? (
                <Select
                  value={assignSelectedManagerId ?? undefined}
                  onValueChange={(value) => setAssignSelectedManagerId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("assign.selectPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {assignManagerOptions.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-fg-subtle">
                  {t("assign.noManagers")}
                </p>
              )}
            </div>
          ) : null}
        </ReusableDialog>

        <ConfirmDialog
          open={removeConfirmId !== null}
          onOpenChange={(open) => {
            if (!open) setRemoveConfirmId(null);
          }}
          title={t("remove.title")}
          description={
            removeItem
              ? t("remove.description", { name: removeItem.name })
              : t("remove.description", { name: "" })
          }
          confirmText={t("remove.confirm")}
          cancelText={t("remove.cancel")}
          variant="destructive"
          onCancel={() => setRemoveConfirmId(null)}
          onConfirm={() => {
            if (!removeConfirmId) return;
            setLocalItems((prev) =>
              prev.map((it) =>
                it.id === removeConfirmId ? { ...it, parentId: null } : it,
              ),
            );
            setRemoveConfirmId(null);
          }}
        />
      </div>
    </div>
  );
}
