"use client";

/**
 * SOMION HQ - SETUP
 *
 * The flow an admin runs once, the first time the module is switched on. The
 * target it is designed against is a usable workspace in under fifteen minutes
 * with no documentation, so every step has a working default and every step can
 * be skipped.
 *
 * The order is deliberate: name, floor, rooms, people, defaults. Rooms come
 * before people because inviting a team into an empty floor is the worst first
 * impression the product can make.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Plus, Trash } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, Chip, Field, Panel } from "@/components/ui/Primitives";
import { useCan, useUsers } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { useT } from "@/lib/i18n";
import { ROOM_LABEL } from "@/lib/presence";
import { floorTemplates } from "@/mock/seed";
import type { FloorTemplate, RoomKind } from "@/entities";
import { msgText } from "@/lib/messages";

const STEPS = ["name", "template", "rooms", "people", "defaults", "ready"] as const;
type Step = (typeof STEPS)[number];

const TEMPLATES: { id: FloorTemplate; label: string; cap: string; rooms: number }[] = [
  { id: "studio", label: msgText("template.studio", "Studio"), cap: msgText("template.studio.capacity", "up to 10 people"), rooms: 3 },
  { id: "team", label: msgText("template.team", "Team floor"), cap: msgText("template.team.capacity", "up to 30 people"), rooms: 7 },
  { id: "agency", label: msgText("template.agency", "Agency"), cap: msgText("template.agency.capacity", "up to 50 people"), rooms: 9 },
];

export function SetupWizard() {
  const router = useRouter();
  const users = useUsers();
  const settings = useWorkspace((s) => s.settings);
  const floor = useWorkspace((s) => s.floor);
  const me = useWorkspace((s) => s.me);
  const update = useWorkspace((s) => s.updateSettings);
  const updateRoom = useWorkspace((s) => s.updateRoom);
  const addRoom = useWorkspace((s) => s.addRoom);
  const removeRoom = useWorkspace((s) => s.removeRoom);
  const can = useCan();
  const t = useT();

  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState(settings.name);
  const [template, setTemplate] = useState<FloorTemplate>(settings.template);
  const [rooms, setRooms] = useState(
    floor.rooms.map((r) => ({ id: r.id, name: r.name, kind: r.kind, capacity: r.capacity })),
  );
  const [invited, setInvited] = useState<string[]>(users.filter((u) => u.id !== me).map((u) => u.id));
  const [quiet, setQuiet] = useState(settings.notifyOn === "mentions_dms");
  const [guests, setGuests] = useState(settings.guestsAllowed);

  const index = STEPS.indexOf(step);
  const isLast = step === "ready";

  if (!can.manageSettings) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[620px] px-5 py-10">
          <Panel>
            <h1 className="hq-title" style={{ color: "var(--color-ink)" }}>
              {t("setup.adminsOnly", "Setup is for admins")}
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "var(--color-ink-muted)" }}>
              {t("setup.adminsOnlyBody", "It changes the floor and the workspace for everyone. Ask an admin, or the owner.")}
            </p>
            <Button size="sm" className="mt-4" onClick={() => router.push("/hq/office")}>
              {t("setup.goToOffice", "Go to the office")}
            </Button>
          </Panel>
        </div>
      </div>
    );
  }

  const commit = () => {
    update({ name: name.trim() || "Workspace", template, notifyOn: quiet ? "mentions_dms" : "all", guestsAllowed: guests });
    /* Rooms the wizard added are created, rooms it dropped are removed, and
       the rest are patched. Before this the step accepted additions and
       removals and then silently discarded both on Finish. */
    const base = template === settings.template ? floor.rooms : floorTemplates[template];
    const existing = new Set(base.map((r) => r.id));
    rooms.forEach((r) => {
      if (existing.has(r.id)) updateRoom(r.id, { name: r.name, capacity: r.capacity });
      else addRoom({ name: r.name, kind: r.kind as RoomKind, capacity: r.capacity });
    });
    base.forEach((r) => {
      if (!rooms.some((x) => x.id === r.id)) removeRoom(r.id);
    });
  };

  const next = () => {
    if (step === "defaults") commit();
    const n = STEPS[index + 1];
    if (n) setStep(n);
  };
  const back = () => {
    const p = STEPS[index - 1];
    if (p) setStep(p);
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[620px] px-5 py-8">
        {/* Progress states where you are without pretending the steps are a
            sequence you cannot leave. */}
        <div className="flex items-center gap-2" aria-hidden="true">
          {STEPS.slice(0, -1).map((s, i) => (
            <span
              key={s}
              className="h-1 flex-1"
              style={{
                borderRadius: "var(--radius-chip)",
                background: i <= index ? "var(--color-accent)" : "var(--color-hairline)",
                transition: "background var(--duration-state) var(--ease-out-soft)",
              }}
            />
          ))}
        </div>
        <p className="tabular mt-2 text-[12px]" style={{ color: "var(--color-ink-subtle)" }}>
          {isLast
            ? t("setup.done", "Done")
            : t("setup.stepOf", "Step {n} of {total}", { n: index + 1, total: STEPS.length - 1 })}
        </p>

        {step === "name" && (
          <Section
            title={t("setup.nameTitle", "What is this workspace called?")}
            body={t("setup.nameBody", "It appears on the guest page your clients see, so use the name they know you by.")}
          >
            <Field
              label={t("setup.workspaceName", "Workspace name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </Section>
        )}

        {step === "template" && (
          <Section
            title={t("setup.templateTitle", "Pick a floor to start from")}
            body={t("setup.templateBody", "You can rename rooms, change how many there are, and switch template later.")}
          >
            <div className="flex flex-col gap-2">
              {TEMPLATES.map((tpl) => {
                const active = template === tpl.id;
                return (
                  <label
                    key={tpl.id}
                    className="hq-row flex cursor-pointer items-center gap-3 px-3.5 py-3"
                    style={{
                      border: `1px solid ${active ? "var(--color-accent)" : "var(--color-hairline-strong)"}`,
                      borderRadius: "var(--radius-control)",
                      background: active ? "var(--color-accent-soft)" : "var(--color-surface)",
                    }}
                  >
                    <input
                      type="radio"
                      name="tpl"
                      checked={active}
                      onChange={() => {
                        setTemplate(tpl.id);
                        /* The rooms step edits the layout you just chose. */
                        setRooms(
                          floorTemplates[tpl.id].map((r) => ({ id: r.id, name: r.name, kind: r.kind, capacity: r.capacity })),
                        );
                      }}
                      style={{ accentColor: "var(--color-accent)" }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-medium" style={{ color: "var(--color-ink)" }}>
                        {t(`template.${tpl.id}`, tpl.label)}
                      </span>
                      <span className="block text-[12px]" style={{ color: "var(--color-ink-muted)" }}>
                        {t(`template.${tpl.id}.capacity`, tpl.cap)}
                      </span>
                    </span>
                    <span className="tabular text-[12px]" style={{ color: "var(--color-ink-subtle)" }}>
                      {t("setup.roomCount", "{n} rooms", { n: tpl.rooms })}
                    </span>
                  </label>
                );
              })}
            </div>
          </Section>
        )}

        {step === "rooms" && (
          <Section
            title={t("setup.roomsTitle", "Name the rooms")}
            body={t("setup.roomsBody", "People say these out loud all day. Names that match how the team already talks work best.")}
          >
            <ul className="flex flex-col gap-2">
              {rooms.map((r, i) => (
                <li key={r.id} className="flex items-center gap-2">
                  <input
                    value={r.name}
                    onChange={(e) =>
                      setRooms((list) =>
                        list.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                      )
                    }
                    aria-label={t("setup.roomName", "Room {n} name", { n: i + 1 })}
                    className="min-w-0 flex-1"
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-hairline-strong)",
                      borderRadius: "var(--radius-control)",
                      padding: "8px 11px",
                      fontSize: "13.5px",
                      minHeight: 36,
                    }}
                  />
                  <Chip>{ROOM_LABEL[r.kind as RoomKind] ?? r.kind}</Chip>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={r.capacity}
                    onChange={(e) =>
                      setRooms((list) =>
                        list.map((x, j) => (j === i ? { ...x, capacity: Number(e.target.value) } : x)),
                      )
                    }
                    aria-label={t("setup.roomCapacity", "{name} capacity", { name: r.name })}
                    className="tabular w-[70px] shrink-0"
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-hairline-strong)",
                      borderRadius: "var(--radius-control)",
                      padding: "8px 10px",
                      fontSize: "13px",
                      minHeight: 36,
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    label={t("setup.removeRoom", "Remove {name}", { name: r.name })}
                    onClick={() => setRooms((list) => list.filter((_, j) => j !== i))}
                    disabled={rooms.length <= 1}
                    style={{ color: "var(--color-ink-subtle)" }}
                  >
                    <Trash size={14} aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
            <Button
              size="sm"
              className="mt-3"
              onClick={() =>
                setRooms((list) => [
                  ...list,
                  {
                    id: `r-new-${list.length}`,
                    name: t("setup.newRoomName", "New room"),
                    kind: "meeting" as RoomKind,
                    capacity: 6,
                  },
                ])
              }
            >
              <Plus size={13} weight="bold" aria-hidden="true" />
              {t("setup.addRoom", "Add a room")}
            </Button>
          </Section>
        )}

        {step === "people" && (
          <Section
            title={t("setup.peopleTitle", "Who is joining?")}
            body={t(
              "setup.peopleBody",
              "These come from your Business OS directory, so there is no second list to keep up to date. Everyone is included by default.",
            )}
          >
            <ul
              className="max-h-[300px] overflow-y-auto"
              style={{ border: "1px solid var(--color-hairline)", borderRadius: "var(--radius-control)" }}
            >
              {users
                .filter((u) => u.id !== me)
                .map((u) => {
                  const on = invited.includes(u.id);
                  return (
                    <li key={u.id}>
                      <button
                        onClick={() =>
                          setInvited((p) => (on ? p.filter((x) => x !== u.id) : [...p, u.id]))
                        }
                        aria-pressed={on}
                        className="hq-row flex w-full items-center gap-2.5 px-3 text-start"
                        style={{ minHeight: 44 }}
                      >
                        <Avatar name={u.name} initials={u.initials} tint={u.tint} size={28} hideStatus />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px]" style={{ color: "var(--color-ink)" }}>
                            <bdi>{u.name}</bdi>
                          </span>
                          <span className="block truncate text-[11.5px]" style={{ color: "var(--color-ink-muted)" }}>
                            <bdi>{u.title}</bdi>
                          </span>
                        </span>
                        <span
                          aria-hidden="true"
                          className="flex shrink-0 items-center justify-center"
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 5,
                            border: `1px solid ${on ? "var(--color-accent)" : "var(--color-hairline-strong)"}`,
                            background: on ? "var(--color-accent)" : "var(--color-surface)",
                            color: "var(--color-ink-inverse)",
                          }}
                        >
                          {on && <Check size={11} weight="bold" />}
                        </span>
                      </button>
                    </li>
                  );
                })}
            </ul>
            <p className="tabular mt-2 text-[12px]" style={{ color: "var(--color-ink-muted)" }}>
              {t("setup.invitedCount", "{n} people will get access", { n: invited.length })}
            </p>
          </Section>
        )}

        {step === "defaults" && (
          <Section
            title={t("setup.defaultsTitle", "Two defaults worth agreeing on")}
            body={t("setup.defaultsBody", "Both can be changed in settings, and both matter more than they look.")}
          >
            <div className="flex flex-col gap-2">
              <Toggle
                label={t("setup.quiet", "Only mentions and direct messages notify people")}
                hint={t(
                  "setup.quietHint",
                  "The alternative is notifying on everything, which is how a workspace becomes the thing people mute.",
                )}
                checked={quiet}
                onChange={setQuiet}
              />
              <Toggle
                label={t("setup.guests", "Let clients join meetings by link")}
                hint={t("setup.guestsHint", "They join with no account, and see your name rather than ours.")}
                checked={guests}
                onChange={setGuests}
              />
            </div>
          </Section>
        )}

        {step === "ready" && (
          <Section
            title={t("setup.readyTitle", "{name} is ready", { name: name.trim() || "Your workspace" })}
            body={t("setup.readyBody", "Three things worth doing in the first day, in this order.")}
          >
            <ol className="flex flex-col gap-2">
              {[
                {
                  title: t("setup.next1", "Sit down at a desk"),
                  body: t("setup.next1b", "Your status goes Available across all seven modules, and the team can see you are there."),
                },
                {
                  title: t("setup.next2", "Start one conversation from a record"),
                  body: t("setup.next2b", "Open a task or an invoice and press Discuss. That is the habit the whole module is built around."),
                },
                {
                  title: t("setup.next3", "Knock on someone instead of scheduling"),
                  body: t("setup.next3b", "A two minute question should not become a calendar invite."),
                },
              ].map((s, i) => (
                <li key={s.title}>
                  <Panel>
                    <div className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="tabular flex shrink-0 items-center justify-center text-[12px] font-semibold"
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "var(--radius-chip)",
                          background: "var(--color-accent-soft)",
                          color: "var(--color-ink-brand)",
                        }}
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13.5px] font-medium" style={{ color: "var(--color-ink)" }}>
                          <bdi>{s.title}</bdi>
                        </span>
                        <span className="mt-0.5 block text-[12.5px] leading-relaxed" style={{ color: "var(--color-ink-muted)" }}>
                          {s.body}
                        </span>
                      </span>
                    </div>
                  </Panel>
                </li>
              ))}
            </ol>
          </Section>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <div>
            {index > 0 && !isLast && (
              <Button size="sm" onClick={back}>
                <ArrowLeft size={13} weight="bold" aria-hidden="true" />
                {t("common.back", "Back")}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isLast && (
              <Button variant="ghost" size="sm" onClick={() => router.push("/hq/office")}>
                {t("setup.skip", "Skip setup")}
              </Button>
            )}
            {isLast ? (
              <Button variant="primary" size="sm" onClick={() => router.push("/hq/office")}>
                {t("setup.goToOffice", "Go to the office")}
                <ArrowRight size={13} weight="bold" aria-hidden="true" />
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={next}>
                {step === "defaults" ? t("setup.finish", "Finish") : t("common.next", "Next")}
                <ArrowRight size={13} weight="bold" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5">
      <h1 className="hq-display" style={{ color: "var(--color-ink)" }}>
        {title}
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "var(--color-ink-muted)", maxWidth: "60ch" }}>
        {body}
      </p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className="hq-row flex cursor-pointer items-start justify-between gap-3 px-3.5 py-3"
      style={{ border: "1px solid var(--color-hairline-strong)", borderRadius: "var(--radius-control)" }}
    >
      <span className="min-w-0">
        <span className="block text-[13.5px] font-medium" style={{ color: "var(--color-ink)" }}>
          {label}
        </span>
        <span className="mt-0.5 block text-[12.5px] leading-relaxed" style={{ color: "var(--color-ink-muted)" }}>
          {hint}
        </span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 shrink-0"
        style={{ width: 18, height: 18, accentColor: "var(--color-accent)" }}
      />
    </label>
  );
}
