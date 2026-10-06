"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "@/redux/app/hooks";
import { logoutUser } from "@/redux/features/auth/authSlice";
import { useLogout } from "@somion/sos-bar";
import { ChevronDown, LogOut } from "lucide-react";
import { useLocale } from "next-intl";
import { getUnauthorizedRedirectUrl } from "@/lib/get-unauthorized-redirect-url";
import { Locale } from "@/i18n/routing";

export function ProfileDropdown() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { logout } = useLogout()

  const locale = useLocale();
  const handleLogout = async () => {
    await logout();
    dispatch(logoutUser());
    window.location.href = getUnauthorizedRedirectUrl(locale as Locale);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-1 rounded-lg !p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-all duration-300 !px-2 mr-1.5">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={user?.avatar || ""}
                alt={user?.firstName}
              />
              <AvatarFallback className="bg-primary/20">
                {user?.firstName} {user?.lastName}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col">
              <h5 className="text-[16px]  flex flex-col">
                {user?.firstName} {user?.lastName}
                <span className="text-xs text-gray-500">
                  {user?.email}
                </span>
              </h5>
              {/* Scope roles: useUserRoles().roles.join(" | ") */}
            </div>
          </div>
          <ChevronDown className="h-4 w-4 ms-2 md:ms-4" />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        {/* <DropdownMenuItem onClick={() => router.push("/profile")}>
          <Settings className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem> */}
        <DropdownMenuItem
          className="hover:!bg-red-50 cursor-pointer transition-all duration-300"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
