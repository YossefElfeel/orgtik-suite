import type { JSX } from "react";
import {
  Briefcase,
  CalendarBlank,
  CalendarCheck,
  ClockCountdown,
  FolderOpen,
  Gear,
  Handshake,
  Money,
  Receipt,
  SlidersHorizontal,
  Ticket,
  TreeStructure,
  UserCircleMinus,
  UserFocus,
  UsersThree,
  Wallet,
} from "@phosphor-icons/react";

/** The sidebar's icons, by route (HR wave, FS-HR-4; D-008: Phosphor everywhere). */
export const NAV_ICONS: Record<string, JSX.Element> = {
  "/attendance": <CalendarCheck />,
  "/calendar": <CalendarBlank />,
  "/employees": <UsersThree />,
  "/projects": <FolderOpen />,
  "/department": <TreeStructure />,
  "/time-off": <ClockCountdown />,
  "/payroll": <Wallet />,
  "/my-payslips": <Receipt />,
  "/loans": <Money />,
  "/hiring/overall": <SlidersHorizontal />,
  "/hiring/jobs": <Briefcase />,
  "/candidates": <UserFocus />,
  "/rejected": <UserCircleMinus />,
  "/tickets": <Ticket />,
  "/configuration": <Gear />,
  "/finance-queue": <Handshake />,
};
