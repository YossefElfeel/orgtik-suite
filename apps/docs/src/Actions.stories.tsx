import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, IconButton } from "@orgtik/ui";
import { DotsThreeVertical, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useCopy } from "./copy";

const meta: Meta<typeof Button> = {
  title: "Actions/Button",
  component: Button,
  args: { children: "Save changes", variant: "primary", size: "md", loading: false, disabled: false },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary", "ghost", "danger", "link", "brand"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Playground: Story = {};

function All() {
  const s = useCopy({
    en: { save: "Save", cancel: "Cancel", del: "Delete", add: "Add member", edit: "Edit", start: "Start trial", plans: "View plans", more: "More actions" },
    ar: { save: "حفظ", cancel: "إلغاء", del: "حذف", add: "إضافة عضو", edit: "تعديل", start: "ابدأ التجربة", plans: "عرض الخطط", more: "إجراءات أخرى" },
  });
  return (
    <div className="flex flex-col gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-3">
          <Button size={size}>{s.save}</Button>
          <Button size={size} variant="secondary">{s.cancel}</Button>
          <Button size={size} variant="ghost" startIcon={<PencilSimple />}>{s.edit}</Button>
          <Button size={size} variant="danger" startIcon={<Trash />}>{s.del}</Button>
          <Button size={size} variant="brand">{s.start}</Button>
          <Button size={size} variant="link">{s.plans}</Button>
          <Button size={size} loading>{s.save}</Button>
          <Button size={size} disabled startIcon={<Plus />}>{s.add}</Button>
          <IconButton size={size} label={s.more} icon={<DotsThreeVertical weight="bold" />} />
          <IconButton size={size} variant="secondary" label={s.edit} icon={<PencilSimple />} />
        </div>
      ))}
    </div>
  );
}

/** Every variant and size. The brand pill's arrow chip points toward the reading end. */
export const AllVariants: Story = { render: () => <All /> };
