"use client";
import {geometryClass} from "@/lib/geometry";

/**
 * SOMION HQ - FLOOR CANVAS
 *
 * Rooms are real HTML buttons positioned in percentage floor units, not shapes
 * inside an SVG. That single decision is what makes the floor keyboard
 * navigable, screen-reader legible and hit-testable for free, instead of
 * needing a parallel accessibility tree bolted on afterwards.
 *
 * No game engine, no canvas, no requestAnimationFrame loop: people move on CSS
 * transitions and each tile owns its own subscription.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LockSimple, Minus, Plus } from "@phosphor-icons/react";
import { PersonTile } from "./PersonTile";
import { PersonMenu } from "./PersonMenu";
import { RoomFurniture } from "./RoomFurniture";
import { Minimap } from "./Minimap";
import { AvatarStack } from "@/components/ui/Avatar";
import { useFloor, useMe, useMyPresence, usePresenceList } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { ROOM_LABEL, ROOM_MATERIAL, ROOM_SURFACE, roomOpensAudio, roomHidesOccupants, ROOM_KIND_SPEC } from "@/lib/presence";
import { useT } from "@/lib/i18n";
import { formatTime } from "@/lib/time";
import { attachVoice, detachAllVoices, detachVoice, playSound, positionListener, positionVoice, setVoiceVolume, setDeafened, EARSHOT_BUBBLE } from "@/lib/audio";
import { Button } from "@/components/ui/Primitives";

/**
 * Tells you the floor can be walked, and gets out of the way once you have
 * walked it. Persisting the dismissal is a per-viewer convenience, so it is
 * the one thing in the product that touches browser storage - and it fails
 * silently to "show the hint" if storage is unavailable.
 */
function WalkHint() {
  const [hidden, setHidden] = useState(true);
  const t = useT();

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem("hq.walked") === "1";
    } catch {
      seen = false;
    }
    setHidden(seen);

    const onWalk = (e: KeyboardEvent) => {
      if (!/^(Arrow(Up|Down|Left|Right)|[wasdWASD])$/.test(e.key)) return;
      setHidden(true);
      try {
        localStorage.setItem("hq.walked", "1");
      } catch {
        /* private window, blocked storage: the hint simply returns next time */
      }
    };
    document.addEventListener("keydown", onWalk);
    return () => document.removeEventListener("keydown", onWalk);
  }, []);

  if (hidden) return null;

  return (
    <p
      className={"pointer-events-none absolute bottom-3 start-3 flex items-center gap-1.5 text-caption "+("ch-color-var---color-ink-subtle")}

    >
      <Key>&#8593;</Key>
      <Key>&#8592;</Key>
      <Key>&#8595;</Key>
      <Key>&#8594;</Key>
      <span className="ms-1">
        {t("office.walkHint", "walk · click to go · space-drag to pan · ctrl-scroll to zoom")}
      </span>
    </p>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={"inline-flex items-center justify-center "+("ch-min-width-17px"+' '+"ch-height-17px"+' '+"ch-padding-0-3px"+' '+"ch-border-radius-var---ot-radius-field"+' '+"ch-border-1px-solid-var---color-hairline-strong"+' '+"ch-background-var---color-surface"+' '+"ch-font-size-var---ot-type-micro-size"+' '+"ch-line-height-1")}

    >
      {children}
    </span>
  );
}

export function FloorCanvas() {
  const floor = useFloor();
  const me = useMe();
  const myPresence = useMyPresence();
  const people = usePresenceList();
  const moveTo = useWorkspace((s) => s.moveTo);
  const joinRoom = useWorkspace((s) => s.joinRoom);
  const leaveRoom = useWorkspace((s) => s.leaveRoom);
  const presence = useWorkspace((s) => s.presence);
  const applyEvent = useWorkspace((s) => s.applyEvent);
  const t = useT();
  const meetings = useWorkspace((s) => s.meetings);
  const othersOnline = useWorkspace((s) => s.presence.filter((p) => p.userId !== s.me && p.status !== "offline").length);

  const [selected, setSelected] = useState<string | null>(null);

  /* ---- view: zoom and pan -----------------------------------------------
     The floor is a place, so it gets the two controls every map has. Zoom is
     clamped: below 1 the floor would float in dead space, and past 2.5 the
     furniture stops being informative and starts being wallpaper.

     Panning is on the MIDDLE button and on space-drag, never on a plain left
     drag - a left drag on the floor already means "walk there", and taking
     that away to add panning would trade a primary action for a secondary
     one. */
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  /* The keyboard handler and the drag handler both need the current view
     without re-subscribing on every pan; a ref mirrors it. */
  const viewRef = useRef(view);
  viewRef.current = view;
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1000, h: 700 });
  const [panning, setPanning] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const panFrom = useRef<{ mx: number; my: number; vx: number; vy: number } | null>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const listenerAt = myPresence?.position ?? { x: 50, y: 50 };

  /* ---- settings that shape the floor ------------------------------------- */
  const earshotSetting = useWorkspace((s) => s.settings.earshot);
  const daylightOn = useWorkspace((s) => s.settings.daylight);
  const hoverCards = useWorkspace((s) => s.settings.roomHoverCards);
  const localMutes = useWorkspace((s) => s.localMutes);
  const localVolumes = useWorkspace((s) => s.localVolumes);
  const selfDeafened = useWorkspace((s) => s.selfDeafened);

  /* A room that does not name its occupants shows a count on the floor and no
     tiles for anyone but you. */
  const visibleOnFloor = useCallback(
    (row: { user: { id: string }; presence: { status: string; roomId?: string } }) => {
      if (row.presence.status === "offline") return false;
      if (row.user.id === me.id) return true;
      const room = row.presence.roomId ? floor.rooms.find((r) => r.id === row.presence.roomId) : undefined;
      return !(room && roomHidesOccupants(room));
    },
    [floor.rooms, me.id],
  );


  /* ---- daylight ----------------------------------------------------------
     The floor is lit by the actual time of day. Morning comes in low and
     warm from the east; noon is bright and overhead; evening is amber from
     the west; night is a cool dim. It changes slowly enough that nobody sees
     it move, and it is the difference between a floor plan and a place. */
  const [hour, setHour] = useState(() => new Date().getHours() + new Date().getMinutes() / 60);
  useEffect(() => {
    const id = setInterval(() => setHour(new Date().getHours() + new Date().getMinutes() / 60), 60_000);
    return () => clearInterval(id);
  }, []);
  const daylight = useMemo(() => {
    if (hour >= 6 && hour < 11) {
      return "radial-gradient(110% 80% at 92% 8%, var(--light-morning) 0%, transparent 60%), radial-gradient(120% 90% at 12% 0%, var(--light-noon) 0%, transparent 62%)";
    }
    if (hour >= 11 && hour < 16) {
      return "radial-gradient(120% 90% at 50% 0%, var(--light-noon) 0%, transparent 64%)";
    }
    if (hour >= 16 && hour < 20) {
      return "radial-gradient(120% 90% at 6% 20%, var(--light-evening) 0%, transparent 62%), radial-gradient(120% 90% at 12% 0%, var(--light-window) 0%, transparent 62%)";
    }
    return "radial-gradient(120% 100% at 50% 0%, var(--light-night) 0%, transparent 70%)";
  }, [hour]);

  /* ---- the spatial audio graph -----------------------------------------
     Voices exist only for people who are actually speaking. Presence itself
     never opens an audio connection - that is the product rule that keeps the
     media bill at roughly $1-2 per user instead of $5-10. */
  useEffect(() => {
    const speaking = presence.filter((p) => p.speaking && p.userId !== me.id);
    const speakingIds = new Set(speaking.map((p) => p.userId));

    setDeafened(selfDeafened || Boolean(myPresence?.deafened));
    setDeafened(selfDeafened || Boolean(myPresence?.deafened));
    speaking.forEach((p, i) => {
      attachVoice(p.userId, 150 + i * 37);
      positionVoice(p.userId, p.position, listenerAt);
      /* Your choice, or a moderator's: either silences them for you. */
      setVoiceVolume(
        p.userId,
        localMutes.includes(p.userId) || p.muted ? 0 : (localVolumes[p.userId] ?? 1),
      );
      /* Your choice, or a moderator's: either silences them for you. */
      setVoiceVolume(
        p.userId,
        localMutes.includes(p.userId) || p.muted ? 0 : (localVolumes[p.userId] ?? 1),
      );
    });

    presence.forEach((p) => {
      if (!speakingIds.has(p.userId)) detachVoice(p.userId);
    });

    positionListener(listenerAt);
  }, [presence, listenerAt, me.id, localMutes, localVolumes, selfDeafened, myPresence?.deafened]);

  useEffect(() => () => detachAllVoices(), []);

  /* Keep the floor covering the frame at every zoom level, so panning can
     never reveal an empty margin beside it. */
  const clampView = useCallback((v: { scale: number; x: number; y: number }) => {
    const scale = Math.min(2.5, Math.max(1, v.scale));
    const el = surfaceRef.current;
    if (!el) return { scale, x: 0, y: 0 };
    const { width, height } = el.getBoundingClientRect();
    const maxX = (width * (scale - 1)) / 2;
    const maxY = (height * (scale - 1)) / 2;
    return {
      scale,
      x: Math.min(maxX, Math.max(-maxX, v.x)),
      y: Math.min(maxY, Math.max(-maxY, v.y)),
    };
  }, []);

  const zoomBy = useCallback(
    (delta: number) => setView((v) => clampView({ ...v, scale: v.scale + delta })),
    [clampView],
  );

  const resetView = useCallback(() => setView({ scale: 1, x: 0, y: 0 }), []);

  /* Put a floor point (in percent) at the centre of the frame, at a given
     zoom. The transform origin is the centre, so the translate is simply the
     point's offset from centre, scaled and negated. */
  const centerOn = useCallback(
    (fx: number, fy: number, scale?: number) => {
      const el = surfaceRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      const s0 = scale ?? viewRef.current.scale;
      const w = width / viewRef.current.scale;
      const h = height / viewRef.current.scale;
      setView(
        clampView({
          scale: s0,
          x: -((fx / 100 - 0.5) * w * s0),
          y: -((fy / 100 - 0.5) * h * s0),
        }),
      );
    },
    [clampView],
  );

  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* "Find Nadia": the strip above the floor asks, the floor answers. */
  const officeFocus = useWorkspace((s) => s.officeFocus);
  useEffect(() => {
    if (!officeFocus) return;
    const p = useWorkspace.getState().presence.find((x) => x.userId === officeFocus.userId);
    if (!p) return;
    centerOn(p.position.x, p.position.y, Math.max(viewRef.current.scale, 1.6));
    setSelected(officeFocus.userId);
    setAnchor(p.position);
  }, [officeFocus, centerOn]);

  /* Space is the pan modifier, so the pointer can say which mode it is in. */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable);
      if (e.code === "Space" && !typing) {
        e.preventDefault();
        setSpaceHeld(true);
      }
    };
    const up = (e: KeyboardEvent) => e.code === "Space" && setSpaceHeld(false);
    document.addEventListener("keydown", down);
    document.addEventListener("keyup", up);
    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener("keyup", up);
    };
  }, []);

  /* Ctrl/Cmd + wheel zooms toward the pointer, which is the gesture every map
     already uses. A bare wheel is left alone so the page can still scroll. */
  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setView((v) => clampView({ ...v, scale: v.scale - e.deltaY * 0.002 }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [clampView]);

  const onPanStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const wantsPan = e.button === 1 || (e.button === 0 && spaceHeld);
      if (!wantsPan) return;
      e.preventDefault();
      setPanning(true);
      panFrom.current = { mx: e.clientX, my: e.clientY, vx: view.x, vy: view.y };
    },
    [spaceHeld, view.x, view.y],
  );

  useEffect(() => {
    if (!panning) return;
    const move = (e: MouseEvent) => {
      const from = panFrom.current;
      if (!from) return;
      setView((v) =>
        clampView({ ...v, x: from.vx + (e.clientX - from.mx), y: from.vy + (e.clientY - from.my) }),
      );
    };
    const up = () => {
      setPanning(false);
      panFrom.current = null;
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [panning, clampView]);

  /* ---- walking, from any input -----------------------------------------
     Keys, a click on the floor and a drag of your own tile all end here, so
     entering and leaving rooms behaves identically whichever way you moved. */
  const walkTo = useCallback(
    (next: { x: number; y: number }) => {
      const here = useWorkspace.getState().presence.find((p) => p.userId === me.id);
      if (!here) return;
      const target = floor.rooms.find(
        (r) =>
          next.x >= r.rect.x &&
          next.x <= r.rect.x + r.rect.w &&
          next.y >= r.rect.y &&
          next.y <= r.rect.y + r.rect.h,
      );
      if (target?.id !== here.roomId) {
        if (target) {
          joinRoom(target.id);
          if (roomOpensAudio(target)) playSound("join");
        } else if (here.roomId) {
          const left = floor.rooms.find((r) => r.id === here.roomId);
          if (left && roomOpensAudio(left)) playSound("leave");
          applyEvent({ type: "presence.room_changed", userId: me.id, roomId: undefined });
          applyEvent({ type: "presence.status_changed", userId: me.id, status: "available" });
        }
      }
      moveTo(next);
      setSelected(null);
      /* Zoomed in, the camera keeps you in frame as you walk. */
      if (viewRef.current.scale > 1) centerOn(next.x, next.y);
    },
    [floor.rooms, joinRoom, moveTo, applyEvent, me.id, centerOn],
  );

  /* ---- drag your own tile ----------------------------------------------- */
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const dragStart = useRef<{ mx: number; my: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  const onMyTileMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragStart.current = { mx: e.clientX, my: e.clientY, moved: false };
  }, []);

  useEffect(() => {
    const toFloor = (cx: number, cy: number) => {
      const rect = surfaceRef.current?.getBoundingClientRect();
      if (!rect) return null;
      return {
        x: Math.min(97, Math.max(3, ((cx - rect.left) / rect.width) * 100)),
        y: Math.min(96, Math.max(3, ((cy - rect.top) / rect.height) * 100)),
      };
    };
    const move = (e: MouseEvent) => {
      const st = dragStart.current;
      if (!st) return;
      if (!st.moved && Math.hypot(e.clientX - st.mx, e.clientY - st.my) < 5) return;
      st.moved = true;
      const f = toFloor(e.clientX, e.clientY);
      if (f) setDrag(f);
    };
    const up = (e: MouseEvent) => {
      const st = dragStart.current;
      dragStart.current = null;
      if (!st) return;
      if (st.moved) {
        const f = toFloor(e.clientX, e.clientY);
        if (f) walkTo({ x: Math.round(f.x), y: Math.round(f.y) });
        /* The mouseup is followed by a click on the tile; swallow that one. */
        suppressClick.current = true;
        setTimeout(() => (suppressClick.current = false), 0);
      }
      setDrag(null);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [walkTo]);

  /* ---- person menu anchor ------------------------------------------------
     The menu is rendered outside the zoomed surface, so it never scales with
     it or clips off the frame. Its anchor is therefore the tile's real screen
     position, re-read whenever the view moves; a second read after the tile's
     own transition settles, so it lands where the tile ends up. */
  const [menuAt, setMenuAt] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (!selected) {
      setMenuAt(null);
      return;
    }
    const read = () => {
      const tile = surfaceRef.current?.querySelector<HTMLElement>(`[data-user="${selected}"]`);
      const c = containerRef.current?.getBoundingClientRect();
      if (!tile || !c) return;
      const r = tile.getBoundingClientRect();
      /* Pixels within the frame; the menu clamps itself against `size`. */
      setMenuAt({ x: r.left + r.width / 2 - c.left, y: r.top + r.height / 2 - c.top });
    };
    read();
    const id = setTimeout(read, 420);
    return () => clearTimeout(id);
  }, [selected, view, size, anchor]);

  /* ---- room hover card ---------------------------------------------------- */
  const [hoverRoom, setHoverRoom] = useState<{ id: string; x: number; y: number; above: boolean } | null>(null);

  /* ---- click to move ---------------------------------------------------- */
  const onSurfaceClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target !== surfaceRef.current) return;
      if (spaceHeld || panning) return;
      /* The rect already includes the zoom transform, so the ratio inside it
         is still the floor coordinate. Reading layout size instead would put
         people wherever the zoom happened to be. */
      const rect = surfaceRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      walkTo({ x: Math.round(x), y: Math.round(y) });
    },
    [walkTo, spaceHeld, panning],
  );

  const onSelectPerson = useCallback((userId: string, at: { x: number; y: number }) => {
    if (suppressClick.current) return;
    setSelected((cur) => (cur === userId ? null : userId));
    setAnchor(at);
  }, []);

  const enterRoom = useCallback(
    (roomId: string) => {
      if (myPresence?.roomId === roomId) {
        leaveRoom();
        playSound("leave");
      } else {
        joinRoom(roomId);
        playSound("join");
      }
      setSelected(null);
    },
    [joinRoom, leaveRoom, myPresence?.roomId],
  );

  /* ---- walking ----------------------------------------------------------
     Arrow keys and WASD walk you across the floor, so the office is usable
     without a pointer at all. Crossing into a room enters it and connects its
     audio; crossing out leaves it. Holding shift covers ground faster.

     Escape leaves the room you are in, the same key that closes everything
     else in the product. */
  useEffect(() => {
    const STEP = 2.5;
    const KEYS: Record<string, [number, number]> = {
      ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
      w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
      W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0],
    };

    const onKey = (e: KeyboardEvent) => {
      /* Never take a key from someone typing, and never fight a shortcut. */
      const el = document.activeElement;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      /* The floor's keys belong to the floor: focus on it, inside it, or on nothing at all. A
         focused button, select or menu elsewhere keeps its own arrows and Escape (CHT-015). */
      const onFloor = !el || el === document.body || Boolean(containerRef.current?.contains(el));
      if (!onFloor) return;
      /* An open dialog or menu owns Escape: it closes that, and only that. */
      if (document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]')) return;

      if (e.key === "Escape") {
        if (selected) setSelected(null);
        else if (myPresence?.roomId) leaveRoom();
        return;
      }

      const dir = KEYS[e.key];
      if (!dir) return;
      /* Shift with a letter is a presenter hotkey, not a fast step. */
      if (e.shiftKey && /^[a-zA-Z]$/.test(e.key)) return;
      /* Arrow keys would otherwise scroll the page under the floor. */
      e.preventDefault();

      const here = useWorkspace.getState().presence.find((p) => p.userId === me.id);
      if (!here) return;

      const distance = e.shiftKey ? STEP * 2 : STEP;
      const next = {
        x: Math.min(97, Math.max(3, here.position.x + dir[0] * distance)),
        y: Math.min(96, Math.max(3, here.position.y + dir[1] * distance)),
      };

      walkTo(next);
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected, myPresence?.roomId, leaveRoom, walkTo, me.id]);

  /* ---- conversation bubbles ----------------------------------------------
     Two people within earshot on the open floor are, in every sense that
     matters, talking - the audio graph already has them hearing each other.
     Drawing that makes the floor's one invisible mechanic visible. Only on the
     open floor: inside a room, the room is the bubble. Earshot here is the
     distance at which the spatial audio is still at half level. */
  const clusters = useMemo(() => {
    /* Earshot is tight on purpose. People at neighbouring desks are ~15 units
       apart and are not in conversation; someone who has walked over to you is
       within 11. At 11 the spatial audio is still at three-quarters level. */
    const EARSHOT = EARSHOT_BUBBLE[earshotSetting];
    const deskIds = new Set(floor.rooms.filter((r) => r.kind === "desk").map((r) => r.id));
    const loose = presence.filter(
      (p) => p.status !== "offline" && (!p.roomId || deskIds.has(p.roomId)),
    );
    const parent = new Map<string, string>();
    const find = (id: string): string => {
      const p = parent.get(id) ?? id;
      if (p === id) return id;
      const root = find(p);
      parent.set(id, root);
      return root;
    };
    loose.forEach((a) =>
      loose.forEach((b) => {
        if (a.userId >= b.userId) return;
        if (Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y) <= EARSHOT) {
          parent.set(find(a.userId), find(b.userId));
        }
      }),
    );
    const groups = new Map<string, typeof loose>();
    loose.forEach((p) => {
      const root = find(p.userId);
      groups.set(root, [...(groups.get(root) ?? []), p]);
    });
    return [...groups.values()]
      .filter((g) => g.length >= 2)
      .map((members) => ({
        members,
        edges: members.flatMap((a) =>
          members
            .filter(
              (b) =>
                a.userId < b.userId &&
                Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y) <= EARSHOT,
            )
            .map((b) => [a, b] as const),
        ),
      }));
  }, [presence, floor.rooms, earshotSetting]);

  const roomOccupants = useMemo(() => {
    const map = new Map<string, typeof people>();
    people.forEach((row) => {
      if (row.presence.roomId && row.presence.status !== "offline") {
        map.set(row.presence.roomId, [...(map.get(row.presence.roomId) ?? []), row]);
      }
    });
    return map;
  }, [people]);

  const occupancy = useMemo(() => {
    const map = new Map<string, number>();
    presence.forEach((p) => {
      if (p.roomId) map.set(p.roomId, (map.get(p.roomId) ?? 0) + 1);
    });
    return map;
  }, [presence]);

  return (
    <div ref={containerRef} className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={surfaceRef}
        onClick={onSurfaceClick}
        onMouseDown={onPanStart}
        className={("relative min-h-0 flex-1 overflow-hidden "+("ch-transform-origin-center-center"+' '+(panning?"ch-transition-none":"ch-transition-transform-180ms-var---ease-out-soft")+' '+"ch-background-var---color-floor"+' '+"ch-background-size-auto-24px-24px"+' '+"ch-box-shadow-inset-0-1px-3px-rgb-var---shadow-ink-0-05"+' '+(panning?"ch-cursor-grabbing":(spaceHeld?"ch-cursor-grab":"ch-cursor-default"))))+" "+((daylightOn?'ch-floor-'+(hour<6||hour>=20?'night':hour<11?'morning':hour<16?'noon':'evening'):'ch-floor-grid')+' '+geometryClass({transform:`translate(${view.x}px, ${view.y}px) scale(${view.scale})`}))}

        role="application"
        aria-label={t("office.canvas", "Office floor. Walk with the arrow keys or W A S D; entering a room connects its audio. Rooms and people are also focusable: Enter opens, Escape leaves.")}
      >
        {/* ---- rooms ---- */}
        {floor.rooms.map((room) => {
          const count = occupancy.get(room.id) ?? 0;
          const full = count >= room.capacity;
          const mine = myPresence?.roomId === room.id;
          return (
            <button
              key={room.id}
              type="button"
              onClick={() => enterRoom(room.id)}
              onMouseEnter={(e) => {
                if (panning || spaceHeld) return;
                const c = containerRef.current?.getBoundingClientRect();
                const r = e.currentTarget.getBoundingClientRect();
                if (!c) return;
                const above = r.top - c.top > 120;
                setHoverRoom({
                  id: room.id,
                  x: r.left - c.left + r.width / 2,
                  y: above ? r.top - c.top : r.bottom - c.top,
                  above,
                });
              }}
              onMouseLeave={() => setHoverRoom(null)}
              className={("hq-room absolute flex flex-col p-2.5 text-start "+((mine?"ch-border-1px-solid-var---color-accent":"ch-border-1px-solid-var---color-wall")+' '+"ch-border-radius-var---radius-room"+' '+"ch-cursor-pointer"))+" "+('ch-room-'+room.kind+' '+'ch-room-'+room.kind+' '+(mine?'ch-room-current':'ch-room-rest')+' '+geometryClass({left:`${room.rect.x}%`,top:`${room.rect.y}%`,width:`${room.rect.w}%`,height:`${room.rect.h}%`}))}

              aria-label={t("office.enterRoom", "{name}, {kind}, {n} of {cap} people. {action}.", {
                name: room.name,
                kind: t(`roomKind.${room.kind}`, ROOM_LABEL[room.kind] ?? room.kind),
                n: count,
                cap: room.capacity,
                action: mine ? t("office.leaveAction", "Leave") : t("office.enterAction", "Enter"),
              })}
            >
              <RoomFurniture roomId={room.id} kind={room.kind} />

              <span className="relative flex w-full items-baseline justify-between gap-2">
                <span
                  className={"relative truncate text-micro font-semibold uppercase "+("ch-color-var---color-floor-label"+' '+"ch-letter-spacing-0-06em")}

                >
                  <bdi>{room.name}</bdi>
                </span>
                <span className="flex shrink-0 items-baseline gap-1">
                  {/* One number per room, set large against a small label. */}
                  <span
                    className={"tabular text-title-sm font-semibold leading-none "+((count > 0?"ch-color-var---color-ink":"ch-color-var---color-paper-500")+' '+"ch-letter-spacing-0-03em")}

                  >
                    {count}
                  </span>
                  <span className={"text-micro "+("ch-color-var---color-ink-subtle")} >
                    {full ? t("office.full", "full") : t("office.ofCapacity", "of {cap}", { cap: room.capacity })}
                  </span>
                  {room.locked && (
                    <LockSimple size={11} weight="bold" aria-hidden="true" className={"ch-color-var---color-ink-subtle"+' '+"ch-margin-inline-start-2px"}  />
                  )}
                </span>
              </span>

              {/* The room's calendar, on the room: the meeting in it now, or
                  the next one within the hour. A scheduled meeting is a fact
                  about the room, not only about the people invited. */}
              {(() => {
                const now = Date.now();
                const mine = meetings.filter((m) => m.roomId === room.id && !m.endedAt);
                const live = mine.find((m) => new Date(m.startsAt).getTime() <= now && new Date(m.endsAt).getTime() >= now);
                const next = mine
                  .filter((m) => new Date(m.startsAt).getTime() > now && new Date(m.startsAt).getTime() - now < 60 * 60_000)
                  .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
                const shown = live ?? next;
                if (!shown) return null;
                return (
                  <span
                    className={"relative mt-1 flex max-w-full items-center gap-1.5 self-start truncate px-1.5 py-0.5 text-micro font-medium "+("ch-border-radius-var---radius-chip"+' '+(live?"ch-background-var---color-presence-meeting-soft":"ch-background-var---color-surface-sunken")+' '+(live?"ch-color-var---color-presence-meeting":"ch-color-var---color-ink-muted"))}

                    title={shown.title}
                  >
                    {live && <span aria-hidden="true" className={"ch-width-6px"+' '+"ch-height-6px"+' '+"ch-border-radius-var---radius-chip"+' '+"ch-background-currentColor"}  />}
                    <span className="truncate">
                      {live
                        ? t("office.meetingUntil", "{title} · until {time}", { title: shown.title, time: formatTime(shown.endsAt) })
                        : t("office.meetingNext", "Next: {title} · {time}", { title: shown.title, time: formatTime(shown.startsAt) })}
                    </span>
                  </span>
                );
              })()}

              {/* An empty room says what it is for. A blank rectangle with a
                  zero in it takes attention that belongs on the people. */}
              {count === 0 && room.kind !== "desk" && (
                <span
                  className={"pointer-events-none absolute inset-x-0 bottom-3 z-[1] mx-auto w-fit px-2 py-1 text-center text-micro leading-snug "+("ch-color-var---color-ink-subtle"+' '+"ch-background-color-mix-in-srgb-var---color-surface-82pct-transparent"+' '+"ch-border-radius-var---radius-control"+' '+"ch-max-width-calc-100pct---16px")}

                >
                  {room.locked
                    ? t("office.roomLocked", "{kind} · {cap} places · locked", {
                        kind: t(`roomKind.${room.kind}`, ROOM_LABEL[room.kind] ?? room.kind),
                        cap: room.capacity,
                      })
                    : (room.purpose ?? ROOM_KIND_SPEC[room.kind]?.hint)
                      ? `${t(`roomKind.${room.kind}`, ROOM_LABEL[room.kind] ?? room.kind)} · ${room.purpose ?? t(`roomKind.${room.kind}.hint`, ROOM_KIND_SPEC[room.kind]?.hint ?? "")}`
                      : roomOpensAudio(room)
                      ? t("office.roomOffer", "{kind} · {cap} places · enter to open audio", {
                          kind: t(`roomKind.${room.kind}`, ROOM_LABEL[room.kind] ?? room.kind),
                          cap: room.capacity,
                        })
                      : /* A room that opens no microphone must not say it
                           does. The prayer room is the case this exists for. */
                        t("office.roomQuiet", "{kind} · {cap} places · no audio, ever", {
                          kind: t(`roomKind.${room.kind}`, ROOM_LABEL[room.kind] ?? room.kind),
                          cap: room.capacity,
                        })}
                </span>
              )}

              {/* Only the exception is labelled. Entering a room connecting audio
                  is the expectation; the desk area not doing so is the thing
                  worth saying, and it is the product's cost model in one line. */}
              {room.kind === "desk" && (
                <span className={"relative mt-auto text-micro "+("ch-color-var---color-ink-subtle")} >
                  {t("office.deskHint", "Open floor. Audio connects in rooms, not here.")}
                </span>
              )}
            </button>
          );
        })}

        {/* ---- conversation bubbles ---- */}
        {clusters.length > 0 && (
          <svg
            aria-hidden="true"
            className={"pointer-events-none absolute inset-0 "+("ch-z-index-5")}
            width={size.w}
            height={size.h}

          >
            {clusters.map(({ members, edges }) => {
              const px = (p: { position: { x: number; y: number } }) =>
                [(p.position.x / 100) * size.w, (p.position.y / 100) * size.h] as const;
              const live = members.some((p) => p.speaking);
              const key = members.map((p) => p.userId).join("+");
              const R = 40;
              /* One solid tint at group opacity, so where capsules overlap the
                 blob stays one blob instead of getting darker at the seams. */
              const tint = "color-mix(in srgb, var(--color-presence-available) 55%, var(--color-surface))";
              return (
                <g key={key} opacity={live ? 0.3 : 0.2}>
                  {edges.map(([a, b]) => {
                    const [ax, ay] = px(a);
                    const [bx, by] = px(b);
                    return (
                      <line
                        key={`${a.userId}-${b.userId}`}
                        x1={ax}
                        y1={ay}
                        x2={bx}
                        y2={by}
                        stroke={tint}
                        strokeWidth={R * 2}
                        strokeLinecap="round"
                      />
                    );
                  })}
                  {members.map((p) => {
                    const [x, y] = px(p);
                    return <circle key={p.userId} cx={x} cy={y} r={R} fill={tint} />;
                  })}
                </g>
              );
            })}
          </svg>
        )}

        {/* ---- people ---- */}
        {people
          .filter(visibleOnFloor)
          .map(({ user }) => (
            <PersonTile
              key={user.id}
              userId={user.id}
              isMe={user.id === me.id}
              listenerAt={listenerAt}
              onSelect={onSelectPerson}
              selected={selected === user.id}
              {...(user.id === me.id ? { onDragStart: onMyTileMouseDown } : {})}
            />
          ))}

        {/* The ghost of where a drag would put you. The tile itself does not
            move until you let go, so a drag you abandon costs nothing. */}
        {drag && (
          <span
            aria-hidden="true"
            className={("pointer-events-none absolute "+("ch-width-44px"+' '+"ch-height-44px"+' '+"ch-transform-translate--50pct--50pct"+' '+"ch-border-radius-var---radius-chip"+' '+"ch-border-2px-dashed-var---color-accent"+' '+"ch-background-color-mix-in-srgb-var---color-accent-10pct-transparent"+' '+"ch-z-index-20"))+" "+(geometryClass({left:`${drag.x}%`,top:`${drag.y}%`}))}

          />
        )}

        <WalkHint />
      </div>

      {selected && menuAt && (
        <PersonMenu userId={selected} at={menuAt} bounds={size} onClose={() => setSelected(null)} />
      )}

      {/* The minimap, while zoomed. Outside the transform so it never scales
          with the thing it is a map of. */}
      {view.scale > 1 && (
        <div className="absolute bottom-3 start-3 z-[35]">
          <Minimap
            rooms={floor.rooms}
            people={people
              .filter(visibleOnFloor)
              .map(({ user, presence }) => ({ id: user.id, x: presence.position.x, y: presence.position.y, isMe: user.id === me.id }))}
            viewport={{
              cx: 0.5 - view.x / (size.w * view.scale),
              cy: 0.5 - view.y / (size.h * view.scale),
              fw: 1 / view.scale,
              fh: 1 / view.scale,
            }}
            aspect={size.w / Math.max(1, size.h)}
            onJump={(fx, fy) => centerOn(fx * 100, fy * 100)}
          />
        </div>
      )}

      {/* Room hover card: who is in there, before you commit to walking in. */}
      {hoverRoom && !panning && hoverCards && (() => {
        const room = floor.rooms.find((r) => r.id === hoverRoom.id);
        if (!room) return null;
        const inside = roomOccupants.get(room.id) ?? [];
        return (
          <div
            role="tooltip"
            className={("hq-floating hq-rise pointer-events-none absolute z-[36] w-[220px] p-2.5 "+((hoverRoom.above?"ch-transform-translate--50pct-calc--100pct---8px":"ch-transform-translate--50pct-8px")+' '+"ch-border-radius-var---radius-control"))+" "+(geometryClass({left:hoverRoom.x,top:hoverRoom.y}))}

          >
            <p className="flex items-baseline justify-between gap-2">
              <span className={"truncate text-body-sm font-semibold "+("ch-color-var---color-ink")} >
                <bdi>{room.name}</bdi>
              </span>
              <span className={"tabular shrink-0 text-micro "+("ch-color-var---color-ink-subtle")} >
                {inside.length}/{room.capacity}
              </span>
            </p>
            <p className={"mt-0.5 text-micro "+("ch-color-var---color-ink-muted")} >
              {t(`roomKind.${room.kind}`, ROOM_LABEL[room.kind] ?? room.kind)}
              {" · "}
              {room.locked
                ? t("office.hoverLocked", "locked, knock to enter")
                : roomOpensAudio(room)
                  ? t("office.hoverAudio", "audio opens when you enter")
                  : t("office.hoverQuiet", "quiet room, no audio")}
            </p>
            {room.purpose && (
              <p className={"mt-1 text-caption "+("ch-color-var---color-ink")} >
                <bdi>{room.purpose}</bdi>
              </p>
            )}
            {room.hours && (
              <p className={"mt-1 text-micro "+("ch-color-var---color-ink-muted")} >
                {t("office.hoverHours", "Open {from} to {to}", { from: room.hours.from, to: room.hours.to })}
              </p>
            )}
            {inside.length > 0 && roomHidesOccupants(room) ? (
              <p className={"mt-1.5 text-micro "+("ch-color-var---color-ink-muted")} >
                {t("office.hoverHidden", "{n} inside. This room does not name who.", { n: inside.length })}
              </p>
            ) : inside.length > 0 ? (
              <div className="mt-2 flex items-center gap-2">
                <AvatarStack people={inside.map(({ user }) => user)} size={20} max={5} />
                <span className={"truncate text-micro "+("ch-color-var---color-ink")} >
                  {inside.map(({ user }) => user.name.split(" ")[0]).join(", ")}
                </span>
              </div>
            ) : (
              <p className={"mt-1.5 text-micro "+("ch-color-var---color-ink-subtle")} >
                {t("office.hoverEmpty", "Nobody in here right now")}
              </p>
            )}
          </div>
        );
      })()}

      {/* The first person in: an empty floor is not a broken one, and it
          says what to do while it fills. */}
      {othersOnline === 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-5 z-[34] flex justify-center px-4">
          <div className={"hq-floating pointer-events-auto max-w-[440px] p-4 "+("ch-border-radius-var---radius-card"+' '+"ch-background-var---color-surface")} role="status" >
            <p className={"text-body-sm font-semibold "+("ch-color-var---color-ink")} >
              {t("office.firstTitle", "You are the first one in today")}
            </p>
            <p className={"mt-1 text-body-sm leading-relaxed "+("ch-color-var---color-ink-muted")} >
              {t("office.firstBody", "The floor fills as people sign in. Until then, set a status so they know how to find you, or bring the rest of the team in.")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="primary" href="/hq/setup">
                {t("office.invite", "Invite people")}
              </Button>
              <Button size="sm" href="/hq/me">
                {t("office.setStatus", "Set your status")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Outside the transformed surface, so the controls never scale with the
          thing they control. */}
      <div className="pointer-events-none absolute bottom-3 end-3 z-[35] flex flex-col items-end gap-1.5">
        {view.scale !== 1 && (
          <button
            onClick={resetView}
            className={"hq-btn hq-floating pointer-events-auto tabular px-2.5 text-caption font-medium "+("ch-border-radius-var---radius-control"+' '+"ch-min-height-28px"+' '+"ch-color-var---color-ink-muted")}

          >
            {t("office.resetZoom", "Reset · {n}%", { n: Math.round(view.scale * 100) })}
          </button>
        )}
        <div
          className={"hq-floating pointer-events-auto flex flex-col overflow-hidden "+("ch-border-radius-var---radius-control")}

        >
          <button
            onClick={() => zoomBy(0.25)}
            disabled={view.scale >= 2.5}
            aria-label={t("office.zoomIn", "Zoom in")}
            className={"hq-btn flex items-center justify-center "+("ch-width-30px"+' '+"ch-height-28px"+' '+"ch-color-var---color-ink-muted")}

          >
            <Plus size={13} weight="bold" aria-hidden="true" />
          </button>
          <span aria-hidden="true" className={"ch-height-1px"+' '+"ch-background-var---color-hairline"}  />
          <button
            onClick={() => zoomBy(-0.25)}
            disabled={view.scale <= 1}
            aria-label={t("office.zoomOut", "Zoom out")}
            className={"hq-btn flex items-center justify-center "+("ch-width-30px"+' '+"ch-height-28px"+' '+"ch-color-var---color-ink-muted")}

          >
            <Minus size={13} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>

    </div>
  );
}
