import { Eye, EyeOff } from "lucide-react";
import React from "react";

function PasswordSuffix({
  showPassword,
  setShowPassword,
}: {
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <button
      type="button"
      className="absolute inset-y-0 right-3 pl-3 flex items-center text-gray-500"
      aria-label="عرض كلمة المرور"
      onClick={() => setShowPassword(!showPassword)}
    >
      {showPassword ? (
        <EyeOff className="h-5 w-5" />
      ) : (
        <Eye className="h-5 w-5" />
      )}
    </button>
  );
}

export default PasswordSuffix;
