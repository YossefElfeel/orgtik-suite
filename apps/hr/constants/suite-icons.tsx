import type { JSX } from "react";
import { Browser, ChartLineUp, ChatsCircle, CheckSquareOffset, Folder, House, Megaphone, UsersThree } from "@phosphor-icons/react";

/** Each suite app's icon, by scope name (D-008: Phosphor; the scopes' iconify ids are ignored). */
export const SUITE_APP_ICONS: Record<string, JSX.Element> = {
  global: <House />,
  file_manager: <Folder />,
  task_manager: <CheckSquareOffset />,
  hq: <ChatsCircle />,
  hr_system: <UsersThree />,
  digital_marketing: <Megaphone />,
  sales: <ChartLineUp />,
  website_manager: <Browser />,
};
