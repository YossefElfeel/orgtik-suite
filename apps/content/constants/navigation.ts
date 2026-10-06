import {
  BadgeDollarSign,
  Bot,
  CodeXml,
  Image,
  Joystick,
  LayoutDashboard,
  Milestone,
  Newspaper,
  Podcast,
  Puzzle,
  Rss,
  Server,
  Text,
} from "lucide-react";

export const SIDEBAR_ITEMS = [
  {
    href: "/",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    href: "/gallery",
    label: "Gallery",
    icon: Image,
  },
  {
    href: "/blogs",
    label: "Blogs",
    icon: Newspaper,
  },
  {
    href: "/features",
    label: "Features",
    icon: Puzzle,
  },
  {
    href: "/services",
    label: "Services",
    icon: Server,
  },
  {
    href: "/testimonials",
    label: "Testimonials",
    icon: Podcast,
  },
  {
    href: "/timeline",
    label: "Timeline",
    icon: Milestone,
  },
  {
    href: "/control",
    label: "Control",
    icon: Joystick,
  },
  {
    href: "/chatbot",
    label: "Chatbot",
    icon: Bot,
  },
  {
    href: "/coupons",
    label: "Coupons",
    icon: BadgeDollarSign,
  },
  {
    href: "/content",
    label: "Content",
    icon: Text,
    subItems: [],
  },
  {
    label: "SEO",
    href: "/seo",
    icon: CodeXml,
    subItems: [],
  },
  {
    href: "/social-media",
    label: "Social Media",
    icon: Rss,
  },
];
