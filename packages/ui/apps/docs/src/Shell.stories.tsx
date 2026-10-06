import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppRail, BannerRegion, Button, IconButton, Input, Logo, PageHeader, Sidebar, SuiteShell, UserMenu, type Banner } from "@orgtik/ui";
import { Bell, ChartLineUp, ChatsCircle, CheckSquareOffset, Clock, Folder, FolderSimple, House, MagnifyingGlass, Megaphone, ShareNetwork, Star, Trash, UsersThree } from "@phosphor-icons/react";
import { useCopy } from "./copy";

const meta: Meta = { title: "Shell/SuiteShell" };
export default meta;

const COPY = {
  en: {
    apps: ["Home", "Files", "Tasks", "Chats", "HR", "Marketing", "Sales"], files: "Files", mine: "My files", recent: "Recent", starred: "Starred", shared: "Shared with me",
    library: "Library", trash: "Trash", search: "Search files", bell: "Notifications", title: "My files", desc: "Everything you own in this workspace.",
    trial: "Trial ends in 2 days", plan: "Choose a plan", failed: "Your last payment didn't go through.", pay: "Pay now", exit: "Exit",
  },
  ar: {
    apps: ["الرئيسية", "الملفات", "المهام", "المحادثات", "الموارد", "التسويق", "المبيعات"], files: "الملفات", mine: "ملفاتي", recent: "الأحدث", starred: "المميزة بنجمة", shared: "تمت مشاركتها معي",
    library: "المكتبة", trash: "المحذوفات", search: "ابحث في الملفات", bell: "الإشعارات", title: "ملفاتي", desc: "كل ما تملكه في مساحة العمل هذه.",
    trial: "تنتهي التجربة خلال يومين", plan: "اختر خطة", failed: "لم تنجح عملية الدفع الأخيرة.", pay: "ادفع الآن", exit: "خروج",
  },
};
const ICONS = [<House />, <Folder weight="fill" />, <CheckSquareOffset />, <ChatsCircle />, <UsersThree />, <Megaphone />, <ChartLineUp />];

function Shell({ banners }: { banners: (s: typeof COPY.en) => Banner[] }) {
  const s = useCopy(COPY);
  return (
    <SuiteShell
      rail={<AppRail current="a1" apps={s.apps.map((label, i) => ({ id: `a${i}`, label, href: "#", icon: ICONS[i] }))} />}
      sidebar={
        <Sidebar
          title={s.files}
          sections={[
            { items: [
              { label: s.mine, href: "#mine", icon: <FolderSimple />, active: true, count: 64 },
              { label: s.recent, href: "#recent", icon: <Clock /> },
              { label: s.starred, href: "#starred", icon: <Star /> },
              { label: s.shared, href: "#shared", icon: <ShareNetwork />, count: 12 },
            ] },
            { label: s.library, items: [{ label: s.trash, href: "#trash", icon: <Trash /> }] },
          ]}
        />
      }
      topBar={{
        start: <Input size="sm" type="search" aria-label={s.search} placeholder={s.search} startIcon={<MagnifyingGlass className="size-4" />} className="max-w-sm" />,
        end: <><IconButton size="sm" label={s.bell} icon={<Bell />} /><UserMenu name="Mona Adel" email="mona@acme.example" onSignOut={() => {}} onLocaleChange={() => {}} /></>,
      }}
      banner={<BannerRegion banners={banners(s)} />}
    >
      <div className="p-6"><PageHeader title={s.title} description={s.desc} /></div>
    </SuiteShell>
  );
}

/** Rail and sidebar sit at the reading start; below 1024px they move into a sheet. */
export const Default: StoryObj = { globals: { layout: "single" }, render: () => <Shell banners={() => []} /> };
/** Two banners apply; the slot shows the more urgent (D-026). */
export const WithBanners: StoryObj = {
  globals: { layout: "single" },
  render: () => (
    <Shell
      banners={(s) => [
        { kind: "trial_ending", title: s.trial, action: <Button size="sm" variant="secondary">{s.plan}</Button> },
        { kind: "payment_failed", description: s.failed, action: <Button size="sm" variant="danger">{s.pay}</Button> },
      ]}
    />
  ),
};
/** Staff viewing a customer workspace always see the ribbon, above the customer's banner (D-017). */
export const StaffViewing: StoryObj = {
  globals: { layout: "single" },
  render: () => <Shell banners={(s) => [{ kind: "staff_viewing", action: <Button size="sm" variant="secondary">{s.exit}</Button> }, { kind: "trial_ending", title: s.trial }]} />,
};

export const Logos: StoryObj = {
  render: () => (
    <div className="flex flex-wrap items-center gap-8">
      <Logo variant="mark" tone="brand" className="h-12" />
      <Logo variant="mark" className="h-12 text-fg" />
      <Logo variant="wordmark" className="h-8 text-fg" />
      <div className="rounded-card bg-chrome p-4 text-fg-on-chrome"><Logo variant="wordmark" className="h-8" /></div>
    </div>
  ),
};
