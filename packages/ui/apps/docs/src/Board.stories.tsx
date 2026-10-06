import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar, Badge, Board, Button, MenuItem, useFormatter, type BoardColumn, type BoardItem, type BoardMove, type BoardStatus } from "@orgtik/ui";
import { CalendarBlank, PencilSimple, Plus } from "@phosphor-icons/react";
import { useCopy } from "./copy";

// The Tasks app's project board. Fixed data and dates, so the baselines don't move.
type Task = BoardItem & { assignee: string; due: string; priority: "high" | "normal" | null };

const COPY = {
  en: {
    label: "Website relaunch board",
    columns: ["To do", "In progress", "In review", "Done"],
    tasks: ["Fix login on Safari", "Write the pricing page copy", "Audit image alt text", "Move DNS to the new host", "Set up the staging site", "Review the footer links", "Draft the launch email", "Ship the cookie banner"],
    people: ["Mona Adel", "Karim Hassan", "Hoda Samir", "Dina Fawzy"],
    high: "High priority", rename: "Rename column", add: "Add the first task",
    addTask: (column: string) => `Add task to ${column}`,
    count: (n: number) => (n === 1 ? "1 task" : `${n} tasks`),
  },
  ar: {
    label: "لوحة إعادة إطلاق الموقع",
    columns: ["قيد الانتظار", "قيد التنفيذ", "قيد المراجعة", "منجز"],
    tasks: ["إصلاح تسجيل الدخول في سفاري", "كتابة نص صفحة الأسعار", "مراجعة النص البديل للصور", "نقل DNS إلى المستضيف الجديد", "إعداد موقع التجربة", "مراجعة روابط التذييل", "صياغة رسالة الإطلاق", "إطلاق شريط ملفات تعريف الارتباط"],
    people: ["منى عادل", "كريم حسن", "هدى سمير", "دينا فوزي"],
    high: "أولوية عالية", rename: "إعادة تسمية العمود", add: "أضف أول مهمة",
    addTask: (column: string) => `إضافة مهمة إلى ${column}`,
    count: (n: number) => ({ zero: "لا مهام", one: "مهمة واحدة", two: "مهمتان", few: `${n} مهام`, many: `${n} مهمة`, other: `${n} مهمة` })[new Intl.PluralRules("ar").select(n)]!,
  },
};

const COLUMN_IDS = ["todo", "doing", "review", "done"] as const;
const COLORS = ["neutral", "info", "warning", "success"] as const;
const PLACES: [string, number][] = [["todo", 0], ["todo", 1], ["todo", 2], ["doing", 3], ["doing", 4], ["review", 5], ["done", 6], ["done", 7]];
const DUES = ["2026-10-06", "2026-10-08", "2026-10-09", "2026-10-02", "2026-10-05", "2026-09-30", "2026-09-28", "2026-09-25"];

function useBoardData() {
  const s = useCopy(COPY);
  const columns = useMemo<BoardColumn[]>(() => COLUMN_IDS.map((id, i) => ({ id, title: s.columns[i]!, color: COLORS[i] })), [s]);
  const items = useMemo<Task[]>(
    () => PLACES.map(([columnId, i]) => ({ id: `t${i + 1}`, columnId, title: s.tasks[i]!, assignee: s.people[i % 4]!, due: DUES[i]!, priority: i % 3 === 0 ? "high" : null })),
    [s],
  );
  return { s, columns, items };
}

function TaskBody({ task, high }: { task: Task; high: string }) {
  const f = useFormatter();
  return (
    <div className="flex items-center gap-2">
      {task.priority === "high" ? <Badge size="sm" tone="danger">{high}</Badge> : null}
      <span className="inline-flex items-center gap-1 text-caption">
        <CalendarBlank aria-hidden="true" className="size-3.5" />
        {f.date(task.due + "T00:00:00", { day: "numeric", month: "short" })}
      </span>
      <Avatar size="xs" name={task.assignee} className="ms-auto" />
    </div>
  );
}

/** The app's side of a move: put the card after `afterId` (or before `beforeId`, or first). */
function applyMove(items: Task[], move: BoardMove): Task[] {
  const moving = items.find((i) => i.id === move.itemId);
  if (!moving) return items;
  const rest = items.filter((i) => i.id !== move.itemId);
  const moved = { ...moving, columnId: move.toColumnId };
  let at = move.afterId ? rest.findIndex((i) => i.id === move.afterId) + 1 : move.beforeId ? rest.findIndex((i) => i.id === move.beforeId) : rest.findIndex((i) => i.columnId === move.toColumnId);
  if (at < 0) at = rest.length;
  return [...rest.slice(0, at), moved, ...rest.slice(at)];
}

// What the interaction checks (tests/interactions.mjs) read and drive.
type Harness = { moves: BoardMove[]; opened: string[]; renders: number; inject?: (task: Task) => void };
const harness = (): Harness => {
  const w = window as unknown as { __orgtik?: Harness };
  return (w.__orgtik ??= { moves: [], opened: [], renders: 0 });
};

function TasksBoard({ status = "ready", readOnly = false, reject = false, empty = false, filtered = false }: { status?: BoardStatus; readOnly?: boolean; reject?: boolean; empty?: boolean; filtered?: boolean }) {
  const { s, columns, items: initial } = useBoardData();
  const [items, setItems] = useState(initial);
  const [lastKey, setLastKey] = useState(initial);
  if (lastKey !== initial) {
    // The language changed: new sample copy.
    setLastKey(initial);
    setItems(initial);
  }
  // A realtime update from someone else, for the checks.
  harness().inject = (task) => setItems((list) => [task, ...list]);
  return (
    <Board
      label={s.label}
      columns={columns}
      items={empty || filtered ? [] : items}
      status={status}
      readOnly={readOnly}
      onRetry={() => {}}
      emptyAction={<Button size="sm" startIcon={<Plus />}>{s.add}</Button>}
      noResults={filtered ? { onClear: () => {} } : undefined}
      renderCard={(task) => {
        harness().renders++;
        return <TaskBody task={task} high={s.high} />;
      }}
      onOpen={(task) => harness().opened.push(task.id)}
      onMove={async (move) => {
        harness().moves.push(move);
        await new Promise((r) => setTimeout(r, 120));
        if (reject) throw new Error("Saving failed");
        setItems((list) => applyMove(list, move));
      }}
      columnActions={() => <MenuItem icon={<PencilSimple />}>{s.rename}</MenuItem>}
      onAdd={() => {}}
      addLabel={(column) => s.addTask(column.title)}
      countLabel={s.count}
    />
  );
}

const meta: Meta<typeof TasksBoard> = {
  title: "Data/Board",
  component: TasksBoard,
  parameters: { layout: "padded" },
  args: { reject: false },
};
export default meta;
type Story = StoryObj<typeof TasksBoard>;

/** Drag a card, press Space on its handle and use the arrows, or use its Move to menu. */
export const Default: Story = {};
/** No handles, no menus, no add buttons; a lock in each header. */
export const ReadOnly: Story = { args: { readOnly: true } };
export const Loading: Story = { args: { status: "loading" } };
export const Failed: Story = { name: "Error", args: { status: "error" } };
export const Empty: Story = { args: { status: "empty" } };
/** Filters are on and match nothing. */
export const NoResults: Story = { args: { filtered: true } };
/** At phone width the columns scroll sideways inside the board, never the page. */
export const PhoneWidth: Story = { render: (args) => <div className="max-w-[360px]"><TasksBoard {...args} /></div> };
