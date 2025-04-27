"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Pause,
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  Wallet,
  CheckCheck,
} from "lucide-react";
import { ServiceButton } from "@/components/service-button";
import { useWashingService } from "@/hooks/use-washing-service";
import { Progress } from "@/components/ui/progress";
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
    finishSession,
    isLoading,
    programs,
    currencySymbol,
    refreshStatus,
    wsConnected,
    setBalance
  } = useWashingService();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [updateFlash, setUpdateFlash] = useState(false);
  const prevBalanceRef = useRef(balance);
  const prevStatusRef = useRef(status);

  useEffect(() => {
    if (showAlert) {
      if (showAlert.includes("Добавлено")) {
        toast.success(showAlert, {
          description: "Баланс успешно обновлен",
          duration: 4000,
        });
      } else {
        toast.warning(showAlert, {
          description: "Пожалуйста, проверьте статус услуги",
          duration: 4000,
        });
      }
      setShowAlert(null);
    }
  }, [showAlert, setShowAlert]);

  useEffect(() => {
    if (balance !== prevBalanceRef.current) {
      setUpdateFlash(true);
      setTimeout(() => setUpdateFlash(false), 700);
    }
    prevBalanceRef.current = balance;

    if (status !== prevStatusRef.current) {
      setUpdateFlash(true);
      setTimeout(() => setUpdateFlash(false), 700);
    }
    prevStatusRef.current = status;
  }, [balance, status]);

  const balancePercentage =
    initialBalance > 0
      ? Math.min(100, Math.max(0, (balance / initialBalance) * 100))
      : 0;

  // Get status class based on current status
  const getStatusClass = () => {
    switch (status) {
      case "Работает":
        return "bg-green-600";
      case "Приостановлено":
        return "bg-amber-500";
      case "Готов к запуску":
        return "bg-blue-500";
      case "Выберите услугу":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleProgramSelect = (program: any) => {
    if (isLoading) return;

    if (status === "Готов к запуску" && selectedProgram?.id === program.id) {
      startProgram();
    } else {
      selectProgram(program);
    }
  };

  // Check if any service is running
  const isServiceRunning = status === "Работает";

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {/* Modified container for portrait optimization */}
      <div className="w-screen h-screen bg-background flex flex-col items-stretch min-h-[100dvh] overflow-hidden portrait:orientation-portrait">
        {/* Header with compact layout */}
        <div className="h-30 bg-card/90 backdrop-blur-sm px-6 flex items-center justify-between shadow-lg z-10 gap-4">
          {/* Refresh button */}
          <div className="space-x-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-14 w-14"
              onClick={refreshStatus}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-6 w-6 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>

            <Button
              variant="default"
              className="h-14 text-2xl"
              onClick={()=>{
                finishSession();
                setBalance(0)
              }}
              disabled={isLoading || balance == 0}
            >
              <CheckCheck className="h-6 w-6" /> Заканчивать
            </Button>
          </div>

          {/* Status indicator */}
          <div
            className={`px-6 py-3 rounded-full text-2xl font-semibold ${getStatusClass()} flex-1 max-w-[400px] text-center`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Загрузка...
              </span>
            ) : (
              status
            )}
          </div>

          {/* Connection status */}
          <div className="flex items-center gap-4">
            <div className="bg-card text-card-foreground px-5 py-3 rounded-full text-2xl shadow-md flex items-center gap-3">
              <Clock className="h-6 w-6 text-primary" />
              {formatTime(timeRemaining)}
            </div>
            <div
              className={`px-5 py-3 rounded-full text-2xl flex items-center gap-3 ${
                wsConnected
                  ? "bg-green-600/20 text-green-400"
                  : "bg-red-600/20 text-red-400"
              }`}
            >
              {wsConnected ? (
                <Wifi className="h-6 w-6" />
              ) : (
                <WifiOff className="h-6 w-6" />
              )}
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 h-full flex items-center justify-between p-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            {/* Balance card */}
            <div className="mb-8 space-y-6">
              <div className="bg-card rounded-2xl p-8 shadow-xl border-2 border-primary/20">
                <div className="flex items-center gap-4 mb-6">
                  <Wallet className="h-8 w-8 text-primary" />
                  <div className="text-2xl font-medium text-muted-foreground">
                    Баланс
                  </div>
                </div>
                <div className="font-bold text-9xl text-card-foreground mb-6">
                  {isLoading && initialBalance === 0 ? (
                    <span className="flex items-center gap-4">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      Загрузка...
                    </span>
                  ) : (
                    `${Number(balance).toLocaleString()} ${currencySymbol}`
                  )}
                </div>
                <Progress
                  value={balancePercentage}
                  className="h-3 bg-primary/10"
                />
              </div>

              {/* Program selection */}
              {selectedProgram && (
                <div className="bg-accent/20 rounded-2xl p-8 border-2 border-primary/10">
                  <div className="flex items-center gap-6">
                    <div className="bg-primary/20 rounded-xl w-20 h-20 flex items-center justify-center text-4xl">
                      {selectedProgram.icon || "⚡"}
                    </div>
                    <div className="flex-1">
                      <div className="text-xl text-primary font-medium mb-2">
                        Выбранная программа
                      </div>
                      <div className="text-3xl font-bold text-card-foreground">
                        {selectedProgram.name}
                      </div>
                    </div>
                    <div className="text-2xl font-semibold text-card-foreground">
                      {Number.parseFloat(selectedProgram.price_per_second) * 60}{" "}
                      {currencySymbol}/мин
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Service buttons grid */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-card-foreground mb-8">
                Выберите программу:
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {programs.map((program) => (
                  <ServiceButton
                    key={program.id}
                    service={{
                      name: program.name,
                      rate: Number.parseFloat(program.price_per_second) * 60,
                      icon: program.icon || getIconForProgram(program.id),
                      code: program.id,
                    }}
                    isSelected={selectedProgram?.id === program.id}
                    isRunning={
                      isServiceRunning && selectedProgram?.id === program.id
                    }
                    onSelect={() => handleProgramSelect(program)}
                    disabled={
                      isLoading ||
                      (isServiceRunning &&
                        selectedProgram?.id === program.id) ||
                      balance <= 0
                    }
                  />
                ))}
              </div>
            </div>

            {/* Control buttons */}
            <div className="space-y-6">
              <Button
                className="w-full py-6 text-2xl font-bold rounded-xl shadow-xl h-auto min-h-[80px]"
                variant={"destructive"}
                onClick={pauseProgram}
                disabled={isLoading || balance <= 0 || !isServiceRunning}
              >
                {isLoading ? (
                  <Loader2 className="mr-4 h-8 w-8 animate-spin" />
                ) : (
                  <Pause className="mr-4 h-8 w-8" />
                )}
                Пауза
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Toaster richColors theme="system" position="bottom-right" />
    </ThemeProvider>
  );
}

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
