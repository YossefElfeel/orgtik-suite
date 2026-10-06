"use client";

import { IStatus } from "@/types/dashboard";
import { motion, Variants } from "framer-motion";
import { CheckCircle, Users, Clock8, FileText, TrendingUp } from "lucide-react";

interface HomeCardsProps {
  status: {
    label: string;
    value: number | string;
    unit: string;
    changeFromLastMonth: number;
    percentageChange: number;
    icon: string;
  }[];
}

import { useMessages } from "next-intl";

export default function HomeCards({ status }: HomeCardsProps) {
  const icons = [CheckCircle, Users, Clock8, FileText];
  const messages = useMessages() as any;
  const tCards = messages?.HomePage?.Cards || {};
  const tUnits = messages?.HomePage?.Units || {};

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <section className="space-y-6">
      <motion.div
        className="grid sm:grid-cols-2 md:grid-cols-4 gap-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {status.map((card, i) => {
          const IconComponent = icons[i];

          return (
            <motion.div
              key={i}
              variants={cardVariants}
              className="col-span-1 bg-white border rounded-lg px-5 py-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-md bg-primary">
                    {IconComponent && (
                      <IconComponent size={18} className="text-white" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-800">
                    {tCards[card.label] || card.label}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[18px] font-medium text-gray-900">
                  {card.value}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{tUnits[card.unit] || card.unit}</span>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                  <TrendingUp className="w-4 h-4" /> {card.percentageChange}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
