"use client";
import { useTransition } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { usePathname, useRouter, type Locale } from "@/i18n/routing";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// flags
import enFlag from "@/public/icons/enFlag.svg";
import deFlag from "@/public/icons/deFlag.svg";
import frFlag from "@/public/icons/frFlag.svg";
import itFlag from "@/public/icons/itFlag.svg";

const Languages = [
  { code: "de", name: "German", flag: deFlag },
  { code: "en", name: "English", flag: enFlag },
  { code: "fr", name: "French", flag: frFlag },
  { code: "it", name: "Italian", flag: itFlag },
];

function LocaleSwitcher() {
  const currentLang = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  const handleLanguageChange = (newLang: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: newLang as Locale });
    });
  };

  const currentLanguage =
    Languages.find((lang) => lang.code === currentLang) || Languages[1];

  return (
    <div className="flex items-center gap-4">
      <Select
        value={currentLang}
        onValueChange={handleLanguageChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-auto min-w-fit min-h-12 gap-2 rounded-[8px] border border-gray-300 bg-[#0F161305]">
          <Image
            alt={currentLanguage.name}
            src={currentLanguage.flag}
            width={20}
            height={20}
            className="block md:hidden"
          />
          <div className="hidden md:block">
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {Languages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <div className="flex items-center gap-2 cursor-pointer">
                <Image
                  alt={language.name}
                  src={language.flag}
                  width={20}
                  height={20}
                />
                <span>{language.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
export default LocaleSwitcher;
