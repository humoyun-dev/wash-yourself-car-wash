"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pause, Loader2, RefreshCw, StopCircle } from "lucide-react";
import { ServiceButton } from "@/components/service-button";
import { useWashingService } from "@/hooks/use-washing-service";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import { ThemeProvider } from "./providers/theme-provider";

export default function App() {
  const {
    balance,
    status,
    timeRemaining,
    selectedProgram,
    selectProgram,
    startProgram,
    pauseProgram,
    formatTime,
    showAlert,
    setShowAlert,
    initialBalance,
    // maxTime,
    isLoading,
    programs,
    currencySymbol,
    finishSession,
    refreshStatus,
  } = useWashingService();

  // Show toast warnings when needed
  useEffect(() => {
    if (showAlert) {
      toast.warning(showAlert, {
        description: "Пожалуйста, проверьте статус услуги",
        duration: 4000,
      });
      setShowAlert(null);
    }
  }, [showAlert, setShowAlert]);

  // Calculate percentage values for progress bars
  const balancePercentage =
    initialBalance > 0
      ? Math.min(100, Math.max(0, (balance / initialBalance) * 100))
      : 0;

  // const timePercentage =
  //   maxTime > 0
  //     ? Math.min(100, Math.max(0, (timeRemaining / maxTime) * 100))
  //     : 0;

  // Get status class based on current status
  const getStatusClass = () => {
    switch (status) {
      case "Работает":
        return "bg-green-600";
      case "Приостановлено":
        return "bg-amber-500";
      case "Готов к запуску":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  // Handle program selection and start
  const handleProgramSelect = (program: any) => {
    if (isLoading) return;

    if (status === "Работает") {
      setShowAlert("Остановите текущую услугу перед выбором новой.");
      return;
    }

    // If we're already in "Готов к запуску" state with this program selected, start it
    if (status === "Готов к запуску" && selectedProgram?.id === program.id) {
      startProgram();
    } else {
      // Otherwise just select the program
      selectProgram(program);
    }
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {/* Full screen container optimized for kiosk usage */}
      <div className="w-screen h-screen bg-background flex items-center justify-center transition-colors duration-300 relative">
        {/* Fixed timer badge */}
        <div className="absolute top-4 right-4 bg-card text-card-foreground px-3 py-1 rounded-full text-sm shadow-md">
          {formatTime(timeRemaining)}
        </div>

        {/* Refresh button */}
        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 left-4 rounded-full"
          onClick={refreshStatus}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          <span className="sr-only">Обновить данные</span>
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-lg border-t-4 border-t-primary">
            <CardContent className="p-6">
              {/* Status Badge */}
              <div className="flex justify-center mb-4">
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    transition: { duration: 0.3 },
                  }}
                  className={`px-4 py-1.5 rounded-full text-white font-medium text-sm ${getStatusClass()} ${
                    isLoading ? "opacity-70" : ""
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      Загрузка...
                    </span>
                  ) : (
                    status
                  )}
                </motion.div>
              </div>

              {/* Balance Card */}
              <div className="mb-6">
                <div className="bg-card rounded-lg p-4 shadow-sm border">
                  <div className="text-muted-foreground text-xs mb-1">
                    Баланс
                  </div>
                  <div className="font-bold text-xl text-card-foreground">
                    {isLoading && initialBalance === 0 ? (
                      <span className="flex items-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Загрузка...
                      </span>
                    ) : (
                      `${balance.toLocaleString()} ${currencySymbol}`
                    )}
                  </div>
                  <Progress value={balancePercentage} className="h-1.5 mt-2" />
                </div>
              </div>

              {/* Selected Program */}
              <AnimatePresence>
                {selectedProgram && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 overflow-hidden"
                  >
                    <div className="bg-accent/30 border rounded-lg p-4 flex items-center">
                      <div className="bg-accent rounded-full w-10 h-10 flex items-center justify-center text-xl mr-3">
                        {selectedProgram.icon || "✓"}
                      </div>
                      <div>
                        <div className="text-xs text-primary font-medium">
                          Выбранная программа
                        </div>
                        <div className="font-semibold text-card-foreground">
                          {selectedProgram.name}
                        </div>
                      </div>
                      <div className="ml-auto text-card-foreground font-medium">
                        {Number.parseFloat(selectedProgram.price_per_second) *
                          60}{" "}
                        {currencySymbol}/мин
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Program Selection */}
              <div className="mb-6">
                <div className="text-sm font-medium text-card-foreground mb-2">
                  Выберите программу:
                </div>

                {programs.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {programs.map((program) => (
                      <ServiceButton
                        key={program.id}
                        service={{
                          name: program.name,
                          rate:
                            Number.parseFloat(program.price_per_second) * 60, // Convert to per minute for display
                          icon: program.icon || getIconForProgram(program.id),
                          code: program.id,
                        }}
                        isSelected={selectedProgram?.id === program.id}
                        isRunning={
                          status === "Работает" &&
                          selectedProgram?.id === program.id
                        }
                        onSelect={() => handleProgramSelect(program)}
                        disabled={
                          isLoading ||
                          (status === "Работает" &&
                            selectedProgram?.id !== program.id)
                        }
                        icon={program.icon || getIconForProgram(program.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  className="w-full py-6 text-base font-medium shadow-md transition-all duration-200"
                  variant={status !== "Работает" ? "outline" : "destructive"}
                  disabled={status !== "Работает" || isLoading}
                  onClick={pauseProgram}
                >
                  {isLoading && status === "Работает" ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Pause className="mr-2 h-5 w-5" />
                  )}
                  Пауза
                </Button>

                {(status === "Приостановлено" ||
                  status === "Готов к запуску") && (
                  <Button
                    className="w-full py-6 text-base font-medium shadow-md transition-all duration-200"
                    variant="outline"
                    disabled={isLoading}
                    onClick={finishSession}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <StopCircle className="mr-2 h-5 w-5" />
                    )}
                    Завершить
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <Toaster richColors theme="system" position="top-center" />
    </ThemeProvider>
  );
}

// Helper function to get icons for programs based on their IDs
function getIconForProgram(id: string): string {
  const iconMap: Record<string, string> = {
    water: "💧",
    turbo_water: "💦",
    osmos: "🔄",
    wax: "✨",
    foam: "🫧",
    active_foam: "🧼",
  };

  return iconMap[id.toLowerCase()] || "✓";
}
