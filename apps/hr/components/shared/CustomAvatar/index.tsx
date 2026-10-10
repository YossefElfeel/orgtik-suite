"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/bindings/avatar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useTranslations } from "next-intl";

type CustomAvatarProps = {
  src?: string | null;
  alt?: string;
  fallback?: string;
  className?: string;
  members?: Member[];
};

type Member = {
  id: number;
  name: string;
  avatar?: string | null;
};

function CustomAvatar({
  src,
  alt,
  fallback,
  className,
  members,
}: CustomAvatarProps) {
  const tCommon = useTranslations("common");
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const renderAvatar = (
    id: number,
    name: string,
    imgSrc?: string | null,
    fallbackText?: string,
    // A person's name (user data) is isolated; the translated fallback isn't.
    isolate = true,
  ) => (
    <div
      key={id}
      className="relative group"
      onMouseEnter={() => setHoveredId(id)}
      onMouseLeave={() => setHoveredId(null)}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {hoveredId === id && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { type: "spring", stiffness: 250, damping: 15 },
            }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            className="absolute -top-10 start-1/2 -translate-x-1/2 bg-primary text-background text-xs font-semibold px-3 py-1 rounded-md shadow-md whitespace-nowrap z-50"
          >
            {isolate ? <bdi>{name}</bdi> : name}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Avatar
          className={cn(
            "w-10 h-10 border-2 border-background shadow-sm rounded-full",
            className,
          )}
        >
          <AvatarImage
            src={imgSrc || ""}
            alt={name}
          />
          <AvatarFallback>{fallbackText}</AvatarFallback>
        </Avatar>
      </motion.div>
    </div>
  );

  // Multiple members
  if (members && members.length > 0) {
    return (
      <div className={cn("flex items-center -space-x-3", className)}>
        {members.map((member) =>
          renderAvatar(
            member.id,
            member.name,
            member.avatar,
            `${member.name?.charAt(0)}`,
          ),
        )}
      </div>
    );
  }

  // Single avatar
  return renderAvatar(
    0,
    alt ?? tCommon("userAvatar"),
    src,
    fallback ?? tCommon("avatarFallback"),
    Boolean(alt),
  );
}

export default CustomAvatar;
