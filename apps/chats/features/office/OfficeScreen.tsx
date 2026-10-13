"use client";

/**
 * SOMION HQ - OFFICE
 *
 * The default landing surface. Two views of the same presence data: the floor
 * (desktop) and the list (always available, and the only view on a phone).
 * The list is not a fallback - it is the guarantee that the product still works
 * after the novelty of the map wears off, which is the failure mode that has
 * closed most of this category.
 */

import {ChatsOnboarding} from "@/features/shell/ChatsOnboarding";
import { useEffect, useState } from "react";
import { ListBullets, MapTrifold } from "@phosphor-icons/react";
import { FloorCanvas } from "./FloorCanvas";
import { PeopleStrip } from "./PeopleStrip";
import { PresenceList } from "./PresenceList";
import { MediaDock } from "./MediaDock";
import { ThisWeekPanel } from "./ThisWeekPanel";
import { FocusSummary } from "./FocusSummary";
import { Button } from "@/components/ui/Primitives";
import { useMyPresence, useOnlineCount } from "@/store/hooks";
import { useT } from "@/lib/i18n";
import { useWorkspace } from "@/store";

type View = "floor" | "list";

export function OfficeScreen() {
  const defaultView = useWorkspace((s) => s.settings.defaultView);
  const [view, setView] = useState<View>(defaultView);
  const [isNarrow, setIsNarrow] = useState(false);
  const online = useOnlineCount();
  const presence = useMyPresence();
  const t = useT();

  /* The floor is desktop-only by explicit product decision. Below 900px the
     list is the office, and the toggle disappears rather than offering a view
     that does not work. */
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    const sync = () => setIsNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const showFloor = view === "floor" && !isNarrow;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatsOnboarding/>
      <header
        className={"flex shrink-0 items-center justify-between gap-3 px-4 py-2.5 "+("ch-background-a8869d")}

      >
        <div className="flex items-baseline gap-2.5">
          <h1 className={"hq-title "+("ch-color-7f7330")} >
            {t("office.title", "Office")}
          </h1>
          <span className={"tabular text-body-sm "+("ch-color-4a0211")} >
            {t("office.aroundCount", "{n} around", { n: online })}
          </span>
        </div>

        <div className="flex items-center gap-2">
        {!isNarrow && <ThisWeekPanel />}
        {!isNarrow && (
          <div
            className={"flex items-center gap-0.5 p-0.5 "+("ch-background-314b28"+' '+"ch-border-radius-332348")}

            role="group"
            aria-label={t("office.viewToggle", "Office view")}
          >
            <Button
              variant={view === "floor" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("floor")}
              aria-pressed={view === "floor"}
              className={(view === "floor"?"ch-box-shadow-03c10c":"")}
            >
              <MapTrifold size={13} weight="bold" aria-hidden="true" />
              {t("office.floorView", "Floor")}
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              className={(view === "list"?"ch-box-shadow-03c10c":"")}
            >
              <ListBullets size={13} weight="bold" aria-hidden="true" />
              {t("office.listView", "List")}
            </Button>
          </div>
        )}
        </div>
      </header>

      {showFloor && <PeopleStrip />}

      <div className="relative flex min-h-0 flex-1 flex-col">
        {showFloor ? (
          <FloorCanvas />
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {isNarrow && (
              <p className={"px-3 pt-3 text-caption "+("ch-color-4a0211")} >
                {t(
                  "office.mobileNote",
                  "The floor plan is a desktop view. Everyone is listed here, grouped by room.",
                )}
              </p>
            )}
            <PresenceList compact={isNarrow} />
          </div>
        )}

        <MediaDock />
        {presence && <FocusSummary />}
      </div>
    </div>
  );
}
