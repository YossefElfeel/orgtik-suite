import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Card, PageHeader, Pagination, StatusBadge, Tabs, TabsList, TabsPanel } from "@orgtik/ui";
import { UploadSimple } from "@phosphor-icons/react";
import { useCopy } from "./copy";

const meta: Meta = { title: "Navigation/All", parameters: { layout: "padded" } };
export default meta;

const COPY = {
  en: { home: "Home", files: "Files", title: "Q3 reports", desc: "Shared with the finance team.", share: "Share", upload: "Upload files", all: "All", shared: "Shared", archived: "Archived", body: "Tab content" },
  ar: { home: "الرئيسية", files: "الملفات", title: "تقارير الربع الثالث", desc: "مشترك مع فريق المالية.", share: "مشاركة", upload: "رفع الملفات", all: "الكل", shared: "المشتركة", archived: "المؤرشفة", body: "محتوى التبويب" },
};

function Header() {
  const s = useCopy(COPY);
  return (
    <PageHeader
      breadcrumb={[{ label: s.home, href: "#" }, { label: s.files, href: "#" }, { label: s.title }]}
      title={s.title}
      status={<StatusBadge entity="share_link" state="active" />}
      description={s.desc}
      actions={<><Button variant="secondary">{s.share}</Button><Button startIcon={<UploadSimple />}>{s.upload}</Button></>}
    />
  );
}
export const PageHeaderStory: StoryObj = { name: "PageHeader", render: () => <Header /> };

function TabsDemo() {
  const s = useCopy(COPY);
  const items = [{ value: "all", label: s.all, count: 312 }, { value: "shared", label: s.shared, count: 14 }, { value: "archived", label: s.archived }];
  return (
    <div className="flex flex-col gap-6">
      {(["line", "contained"] as const).map((variant) => (
        <Tabs key={variant} defaultValue="all">
          <TabsList items={items} variant={variant} />
          <TabsPanel value="all" className="pt-3 text-body text-fg-muted">{s.body}</TabsPanel>
        </Tabs>
      ))}
      <Tabs defaultValue="all" orientation="vertical" className="grid grid-cols-[12rem_1fr] gap-4">
        <TabsList items={items} variant="side" />
        <TabsPanel value="all" className="text-body text-fg-muted">{s.body}</TabsPanel>
      </Tabs>
    </div>
  );
}
/** Arrow keys follow the reading direction; the side list goes up and down. */
export const TabsStory: StoryObj = { name: "Tabs", render: () => <TabsDemo /> };

function Pager() {
  const [page, setPage] = useState(3);
  const [size, setSize] = useState(10);
  return (
    <Card padding="sm">
      <Pagination page={page} pageSize={size} total={312} onPageChange={setPage} onPageSizeChange={setSize} />
    </Card>
  );
}
export const PaginationStory: StoryObj = { name: "Pagination", render: () => <Pager /> };
