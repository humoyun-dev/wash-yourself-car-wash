"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";

interface ServiceButtonProps {
  service: {
    name: string;
    rate: number;
    icon?: string;
    code: string;
  };
  isSelected: boolean;
  isRunning?: boolean;
  onSelect: () => void;
  disabled: boolean;
  icon?: string;
}

export function ServiceButton({
  service,
  isSelected,
  isRunning = false,
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
          isSelected ? "shadow-md" : "bg-card text-card-foreground"
        } ${disabled ? "opacity-60" : ""}`}
        onClick={onSelect}
        disabled={disabled}
      >
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-lg ${
            isSelected ? "bg-primary/80" : "bg-accent"
          }`}
        >
          {icon || "✓"}
        </div>
        <div className="text-left flex-1">
          <div className="font-medium text-sm">{service.name}</div>
          <div
            className={`text-xs ${
              isSelected
                ? "text-primary-foreground/80"
                : "text-muted-foreground"
            }`}
          >
            {service.rate.toLocaleString()} UZS/мин
          </div>
        </div>
        {isSelected && !isRunning && (
          <Play className="h-4 w-4 ml-1 text-primary-foreground/90" />
        )}
        {isRunning && (
          <Loader2 className="h-4 w-4 ml-1 text-primary-foreground/90 animate-spin" />
        )}
      </Button>
    </motion.div>
  );
}
