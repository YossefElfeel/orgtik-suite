"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { motion } from "framer-motion";

export const Breadcrumb = () => {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);

  const breadcrumbItems = [
    {
      label: "Dashboard",
      href: `/`,
    },
    ...pathSegments.map((segment, index) => {
      const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
      return {
        label: segment,
        href,
      };
    }),
  ];

  const shouldShowDropdown = breadcrumbItems.length > 4;
  const visibleItems = shouldShowDropdown
    ? [breadcrumbItems[0], ...breadcrumbItems.slice(-2)]
    : breadcrumbItems;
  const hiddenItems = shouldShowDropdown ? breadcrumbItems.slice(1, -2) : [];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-label="Breadcrumb navigation"
    >
      <div className="flex items-center px-2.5 flex-1">
        <ol className="flex items-center space-x-1 min-w-0">
          {visibleItems.map((item, index) => {
            const isLast = index === visibleItems.length - 1;
            const actualIndex =
              shouldShowDropdown && index > 0
                ? breadcrumbItems.length - (visibleItems.length - index)
                : index;

            return (
              <motion.li
                key={item.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: actualIndex * 0.1 }}
                className="flex items-center min-w-0"
              >
                {shouldShowDropdown && index === 1 && (
                  <>
                    <ChevronRight className="mx-1 h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="relative group">
                      <button className="flex items-center gap-1 px-2 py-1 text-14 font-medium text-gray-600 hover:text-primary hover:bg-blue-50 rounded-lg transition-all duration-200">
                        <span>...</span>
                        <svg
                          className="w-3 h-3 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        {hiddenItems.map((hiddenItem) => (
                          <Link
                            key={hiddenItem.href}
                            href={hiddenItem.href}
                            className="block px-3 py-2 text-14 text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors duration-200"
                          >
                            {hiddenItem.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {((shouldShowDropdown && index > 1) ||
                  (!shouldShowDropdown && index > 0)) && (
                  <ChevronRight className="mx-1 h-4 w-4 text-gray-400 flex-shrink-0" />
                )}

                {isLast ? (
                  <span className="flex items-center text-14 font-semibold text-gray-400 ">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="flex items-center text-14 font-semibold text-gray-600 hover:text-primary transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                )}
              </motion.li>
            );
          })}
        </ol>
      </div>
    </motion.nav>
  );
};
