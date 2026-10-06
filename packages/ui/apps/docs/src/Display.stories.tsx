import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Avatar, Badge, Button, Card, CardHeader, EmptyState, ErrorState, LoadingState, NoPermissionState, STATUS_MATRIX, Spinner, StatusBadge, Toaster, toast,
  type StatusEntity,
} from "@orgtik/ui";
import { UploadSimple } from "@phosphor-icons/react";
import { useCopy } from "./copy";

const meta: Meta = { title: "Display/All", parameters: { layout: "padded" } };
export default meta;

const TONES = ["neutral", "brand", "info", "success", "warning", "danger"] as const;

function Badges() {
  return (
    <div className="flex flex-col gap-3">
      {(["subtle", "solid", "outline"] as const).map((emphasis) => (
        <div key={emphasis} className="flex flex-wrap gap-2">
          {TONES.map((t) => <Badge key={t} tone={t} emphasis={emphasis}>{t}</Badge>)}
        </div>
      ))}
    </div>
  );
}
export const BadgeTones: StoryObj = { render: () => <Badges /> };

function Matrix({ viewer }: { viewer: "staff" | "customer" }) {
  return (
    <div className="flex flex-col gap-4">
      {(Object.keys(STATUS_MATRIX) as StatusEntity[]).map((entity) => (
        <div key={entity} className="flex flex-col gap-2">
          <div dir="ltr" className="text-start font-mono text-caption text-fg-subtle">{entity}</div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(STATUS_MATRIX[entity]).map((state) => (
              <StatusBadge key={state} entity={entity} state={state as never} viewer={viewer} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
/** Every state in the unified status matrix, as staff see it. */
export const StatusMatrix: StoryObj = { render: () => <Matrix viewer="staff" /> };
/** The same, as customers see it (D-027): only states with a customer label change. */
export const StatusMatrixCustomer: StoryObj = { render: () => <Matrix viewer="customer" /> };

function People() {
  const s = useCopy({ en: ["Mona Adel", "Karim Hassan", "Hoda Samir"], ar: ["منى عادل", "كريم حسن", "هدى سمير"] });
  return (
    <div className="flex flex-wrap items-center gap-3">
      {(["xs", "sm", "md", "lg"] as const).map((size) => s.map((n) => <Avatar key={size + n} name={n} size={size} />))}
      <Spinner label />
    </div>
  );
}
export const AvatarsAndSpinner: StoryObj = { render: () => <People /> };

function States() {
  const s = useCopy({
    en: { empty: "No files yet", emptyBody: "Upload files or drag them here. Everyone in this folder can see them.", upload: "Upload files", card: "Owners", cardBody: "People who can change this folder." },
    ar: { empty: "لا توجد ملفات بعد", emptyBody: "ارفع الملفات أو اسحبها إلى هنا. يمكن لكل من في هذا المجلد رؤيتها.", upload: "رفع الملفات", card: "المالكون", cardBody: "الأشخاص الذين يمكنهم تعديل هذا المجلد." },
  });
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card><CardHeader title={s.card} description={s.cardBody} /><LoadingState rows={2} className="mt-3" /></Card>
      <Card padding="sm"><EmptyState size="compact" title={s.empty} description={s.emptyBody} action={<Button size="sm" startIcon={<UploadSimple />}>{s.upload}</Button>} /></Card>
      <Card padding="sm"><ErrorState size="compact" onRetry={() => {}} /></Card>
      <Card padding="sm"><NoPermissionState size="compact" /></Card>
    </div>
  );
}
/** The states every list must have. Each one offers the next step. */
export const ListStatesGallery: StoryObj = { render: () => <States /> };

function Toasts() {
  const s = useCopy({
    en: { ok: "Changes saved", okBody: "Everyone in the folder sees the new name.", err: "Couldn't save", show: "Success toast", showErr: "Error toast" },
    ar: { ok: "تم حفظ التغييرات", okBody: "يرى كل من في المجلد الاسم الجديد.", err: "تعذّر الحفظ", show: "رسالة نجاح", showErr: "رسالة خطأ" },
  });
  return (
    <div className="flex gap-2">
      <Button variant="secondary" onClick={() => toast.success(s.ok, { description: s.okBody })}>{s.show}</Button>
      <Button variant="secondary" onClick={() => toast.error(s.err)}>{s.showErr}</Button>
      <Toaster />
    </div>
  );
}
// One Toaster per page: the matrix would render four.
export const ToastStory: StoryObj = { name: "Toast", globals: { layout: "single" }, render: () => <Toasts /> };
