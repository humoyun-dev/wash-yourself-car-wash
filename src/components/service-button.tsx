"use client";

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
    <div>
      <Button
        variant={isSelected ? "default" : "outline"}
        className={`w-full h-40 !text-4xl text-center py-5 px-5 flex items-center justify-start gap-4 transition-colors duration-200 ${
          isSelected ? "shadow-md" : "bg-card text-card-foreground"
        } ${disabled ? "opacity-60" : ""}`}
        onClick={onSelect}
        disabled={disabled}
      >
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl ${
            isSelected ? "bg-primary/80" : "bg-accent"
          }`}
        >
          {icon || "✓"}
        </div>
        <div className="text-center flex-1">
          <div className="font-medium ">{service.name}</div>
          <div
            className={`text-2xl ${
              isSelected
                ? "text-primary-foreground/80"
                : "text-muted-foreground"
            }`}
          >
            {service.rate.toLocaleString()} UZS/мин
          </div>
        </div>
        {isSelected && !isRunning && (
          <Play className="h-6 w-6 ml-2 text-primary-foreground/90" />
        )}
        {isRunning && (
          <Loader2 className="h-6 w-6 ml-2 text-primary-foreground/90 animate-spin" />
        )}
      </Button>
    </div>
  );
}
