import { Eye, EyeSlash as EyeOff } from "@phosphor-icons/react";
import React from "react";
import { cn } from "@/lib/utils";

const globalConfig = {
  styles: {
    buttonClassName:
      "absolute inset-y-0 end-0 pe-3 flex items-center text-fg-subtle",
    iconClassName: "h-5 w-5",
  },
};

interface PasswordSuffixProps {
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
  iconClassName?: string;
}

function PasswordSuffix({
  showPassword,
  setShowPassword,
  className,
  iconClassName,
}: PasswordSuffixProps) {
  return (
    <button
      type="button"
      className={cn(globalConfig?.styles.buttonClassName, className)}
      aria-label="Show password"
      onClick={() => setShowPassword(!showPassword)}
    >
      {showPassword ? (
        <EyeOff
          className={cn(globalConfig?.styles.iconClassName, iconClassName)}
        />
      ) : (
        <Eye
          className={cn(globalConfig?.styles.iconClassName, iconClassName)}
        />
      )}
    </button>
  );
}

export default PasswordSuffix;
