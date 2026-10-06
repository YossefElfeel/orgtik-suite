import Image from "next/image";
import React from "react";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type OrgtikLogoVariant = "icon" | "text" | "full" | "horizontal" | "horizontal-dark";

type OrgtikLogoProps = {
  className?: string;
  href?: string;
  iconClassName?: string;
  disableLink?: boolean;
  variant?: OrgtikLogoVariant;
};

const LOGO_SRC: Record<OrgtikLogoVariant, string> = {
  icon: "/images/logo/icon-logo.svg",
  text: "/images/logo/text-logo.svg",
  full: "/images/logo/full-logo.svg",
  horizontal: "/images/logo/logo-horizontal.svg",
  "horizontal-dark": "/images/logo/logo-horizontal-dark.svg",
};

const LOGO_DIMENSIONS: Record<
  OrgtikLogoVariant,
  { width: number; height: number; className: string }
> = {
  icon: { width: 50, height: 50, className: "size-8.5 shrink-0" },
  text: { width: 120, height: 32, className: "h-8 w-auto object-contain" },
  full: { width: 200, height: 58, className: "h-9 w-auto object-contain" },
  horizontal: { width: 200, height: 58, className: "h-9 w-auto object-contain" },
  "horizontal-dark": {
    width: 200,
    height: 58,
    className: "h-9 w-auto object-contain",
  },
};

function OrgtikLogo({
  className,
  href = "/",
  iconClassName,
  disableLink = false,
  variant = "icon",
}: OrgtikLogoProps) {
  const dimensions = LOGO_DIMENSIONS[variant];

  const content = (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src={LOGO_SRC[variant]}
        alt="Orgtik"
        width={dimensions.width}
        height={dimensions.height}
        className={cn(dimensions.className, iconClassName)}
      />
    </div>
  );

  if (disableLink) {
    return content;
  }

  return (
    <Link href={href} className="inline-flex">
      {content}
    </Link>
  );
}

export default OrgtikLogo;
