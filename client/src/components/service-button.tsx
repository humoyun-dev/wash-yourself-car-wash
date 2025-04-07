"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ServiceButtonProps {
  service: {
    name: string;
    rate: number;
    icon?: string;
  };
  isSelected: boolean;
  onSelect: (service: { name: string; rate: number }) => void;
  disabled: boolean;
  icon?: string;
}

export function ServiceButton({
  service,
  isSelected,
  onSelect,
  disabled,
  icon,
}: ServiceButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      <Button
        variant={isSelected ? "default" : "outline"}
        className={`w-full h-auto py-3 px-3 flex items-center justify-start gap-2 transition-all duration-200 ${
          isSelected
            ? "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 shadow-md"
            : "bg-white hover:bg-gray-50 text-gray-800 border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-700"
        } ${disabled ? "opacity-60" : ""}`}
        onClick={() => onSelect(service)}
        disabled={disabled}
      >
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-lg ${
            isSelected
              ? "bg-blue-500 dark:bg-blue-600"
              : "bg-blue-100 dark:bg-blue-900"
          }`}
        >
          {icon || "✓"}
        </div>
        <div className="text-left">
          <div className="font-medium text-sm">{service.name}</div>
          <div
            className={`text-xs ${
              isSelected ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {service.rate.toLocaleString()} UZS/мин
          </div>
        </div>
      </Button>
    </motion.div>
  );
}
