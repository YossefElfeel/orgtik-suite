"use client";

import Image from "next/image";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "/images/flags/en.png" },
  { code: "de", name: "Deutsch", flag: "/images/flags/de.png" },
  { code: "fr", name: "French", flag: "/images/flags/fr.png" },
  { code: "it", name: "Italian", flag: "/images/flags/it.png" },
];

function LanguageTabs() {
  const [activeTab, setActiveTab] = useState("en");
  const [headers, setHeaders] = useState({
    en: "",
    de: "",
    fr: "",
    it: "",
  });

  const handleChange = (lang: string, value: string) => {
    setHeaders((prev) => ({ ...prev, [lang]: value }));
  };

  const handleSave = () => {
    console.log("Saved Headers:", headers);
  };

  return (
    <div className="p-4 border rounded-xl bg-white  mt-5">
      <Tabs
        defaultValue={activeTab}
        onValueChange={(lang) => setActiveTab(lang)}
        className="w-full"
      >
        {/* Tabs Header */}
        <TabsList className="grid grid-cols-4 w-full mb-4">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <TabsTrigger
              key={lang.code}
              value={lang.code}
              className={`flex items-center justify-center gap-2 text-sm  `}
            >
              <Image
                src={lang.flag}
                alt={lang.name}
                width={20}
                height={20}
                className={`rounded-sm `}
              />
              <span>{lang.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tabs Content */}
        {SUPPORTED_LANGUAGES.map((lang) => (
          <TabsContent key={lang.code} value={lang.code}>
            <div className="space-y-3">
              <label className="text-sm font-medium">Headers</label>
              <Input
                placeholder="Write a title"
                value={headers[lang.code as keyof typeof headers]}
                onChange={(e) => handleChange(lang.code, e.target.value)}
              />
              <Button className="w-full " onClick={handleSave}>
                Save Change
              </Button>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default LanguageTabs;
