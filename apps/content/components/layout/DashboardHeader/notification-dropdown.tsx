"use client";

import { Bell, SquareArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { useState } from "react";

// 🧩 دالة لتنسيق التاريخ
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 🧠 بيانات تجريبية بدل الـ Redux API
const mockNotifications = [
  {
    id: 1,
    title: "New Message",
    message: "You received a new message from John Doe.",
    actor: { name: "John Doe", avatar: "https://i.pravatar.cc/100?img=1" },
    createdAt: "2025-10-26T09:00:00Z",
    readAt: null,
    status: "unread",
  },
  {
    id: 2,
    title: "Mentioned in Comment",
    message: "Sarah mentioned you in a comment.",
    actor: { name: "Sarah Connor", avatar: "https://i.pravatar.cc/100?img=5" },
    createdAt: "2025-10-25T14:45:00Z",
    readAt: "2025-10-25T15:00:00Z",
    status: "mentions",
  },
  {
    id: 3,
    title: "Project Update",
    message: "Your project ‘Portfolio Redesign’ was approved.",
    actor: { name: "Admin", avatar: "https://i.pravatar.cc/100?img=8" },
    createdAt: "2025-10-24T17:30:00Z",
    readAt: null,
    status: "unread",
  },
  {
    id: 4,
    title: "New Follower",
    message: "Emma Watson started following you.",
    actor: { name: "Emma Watson", avatar: "https://i.pravatar.cc/100?img=3" },
    createdAt: "2025-10-22T10:15:00Z",
    readAt: "2025-10-22T11:00:00Z",
    status: "all",
  },
];

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "unread" | "mentions"
  >("all");
  const [visibleCount, setVisibleCount] = useState(5);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "unread") return n.status === "unread";
    if (activeFilter === "mentions") return n.status === "mentions";
    return true;
  });

  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
    );
  };

  const handleLoadMore = () => setVisibleCount((prev) => prev + 5);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative border p-5">
          <Bell className="w-5 h-5 text-gray-500" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[460px] rounded-xl border bg-white shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2 font-semibold text-gray-800">
            <Bell className="w-5 h-5" /> Notifications
          </div>
          <Button
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 px-4 py-2 text-sm">
          <Button
            variant="outline"
            onClick={() => {
              setActiveFilter("all");
              setVisibleCount(5);
            }}
            className={`${
              activeFilter === "all" ? "bg-gray-100 font-medium text-black" : ""
            }`}
          >
            All {notifications.length}
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setActiveFilter("unread");
              setVisibleCount(5);
            }}
            className={`${
              activeFilter === "unread"
                ? "bg-gray-100 font-medium text-black"
                : ""
            }`}
          >
            Unread {notifications.filter((n) => n.status === "unread").length}
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setActiveFilter("mentions");
              setVisibleCount(5);
            }}
            className={`${
              activeFilter === "mentions"
                ? "bg-gray-100 font-medium text-black"
                : ""
            }`}
          >
            Mentions{" "}
            {notifications.filter((n) => n.status === "mentions").length}
          </Button>
        </div>

        {/* Notifications */}
        <div className="p-2 space-y-1 max-h-[320px] overflow-y-auto">
          {filteredNotifications.slice(0, visibleCount).map((notifi) => (
            <div
              key={notifi.id}
              className="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition relative"
            >
              {/* Left side */}
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage
                    src={notifi.actor.avatar}
                    alt={notifi.actor.name}
                  />
                  <AvatarFallback>{notifi.actor.name.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex flex-col items-start gap-0.5">
                  <p className="text-sm text-gray-800">{notifi.message}</p>
                  <span className="text-xs text-gray-500">
                    {formatDate(notifi.createdAt)}
                  </span>
                </div>
              </div>

              {/* red dot if unread */}
              {!notifi.readAt && (
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 group-hover:hidden"></span>
              )}
              {/* Hover Link Icon */}
              <Link
                href="/notifications"
                className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <SquareArrowUpRight className="h-5 w-5 text-primary hover:text-primary-700" />
              </Link>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t p-3 text-center">
          {visibleCount < filteredNotifications.length ? (
            <Button variant="outline" onClick={handleLoadMore}>
              View more
            </Button>
          ) : (
            <span className="text-sm text-gray-500">No more notifications</span>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
