"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause } from "lucide-react";
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
    selectedService,
    selectService,
    startService,
    pauseService,
    formatTime,
    showAlert,
    setShowAlert,
    initialBalance,
    maxTime,
  } = useWashingService();

  const services = [
    { name: "Вода", rate: 1500, icon: "💧" },
    { name: "Турбо вода", rate: 2000, icon: "💦" },
    { name: "Осмос", rate: 2200, icon: "🔄" },
    { name: "Воск", rate: 2500, icon: "✨" },
    { name: "Пена", rate: 3500, icon: "🫧" },
    { name: "Активная пена", rate: 3000, icon: "🧼" },
  ];

  // Handle alert with toast
  useEffect(() => {
    if (showAlert) {
      toast.warning(showAlert, {
        description: "Пожалуйста, проверьте статус услуги",
        duration: 4000,
      });
      setShowAlert(null);
    }
  }, [showAlert, setShowAlert]);

  // Calculate progress percentages
  const balancePercentage = Math.min(
    100,
    Math.max(0, (balance / initialBalance) * 100)
  );
  const timePercentage =
    maxTime > 0
      ? Math.min(100, Math.max(0, (timeRemaining / maxTime) * 100))
      : 0;

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4 flex items-center justify-center transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-lg border-t-4 border-t-blue-500 dark:border-t-blue-400 dark:bg-gray-800">
            <CardContent className="p-6">
              <motion.div
                className="text-center mb-6"
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  Панель управления мойкой
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  Выберите услугу, чтобы начать
                </p>
              </motion.div>

              {/* Status Badge */}
              <div className="flex justify-center mb-4">
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    transition: { duration: 0.3 },
                  }}
                  className={`px-4 py-1.5 rounded-full text-white font-medium text-sm ${
                    status === "Работает"
                      ? "bg-green-500 dark:bg-green-600"
                      : status === "Приостановлено"
                      ? "bg-amber-500 dark:bg-amber-600"
                      : status === "Готов к запуску"
                      ? "bg-blue-500 dark:bg-blue-600"
                      : "bg-gray-500 dark:bg-gray-600"
                  }`}
                >
                  {status}
                </motion.div>
              </div>

              {/* Balance and Time Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-600">
                  <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                    Баланс
                  </div>
                  <div className="font-bold text-xl text-gray-800 dark:text-gray-100">
                    {balance.toLocaleString()} UZS
                  </div>
                  <Progress value={balancePercentage} className="h-1.5 mt-2" />
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-600">
                  <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                    Оставшееся время
                  </div>
                  <div className="font-bold text-xl text-gray-800 dark:text-gray-100">
                    {formatTime(timeRemaining)}
                  </div>
                  <Progress value={timePercentage} className="h-1.5 mt-2" />
                </div>
              </div>

              {/* Selected Service */}
              <AnimatePresence>
                {selectedService && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 overflow-hidden"
                  >
                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-lg p-4 flex items-center">
                      <div className="bg-blue-100 dark:bg-blue-800 rounded-full w-10 h-10 flex items-center justify-center text-xl mr-3">
                        {services.find((s) => s.name === selectedService.name)
                          ?.icon || "✓"}
                      </div>
                      <div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          Выбранная услуга
                        </div>
                        <div className="font-semibold text-blue-800 dark:text-blue-300">
                          {selectedService.name}
                        </div>
                      </div>
                      <div className="ml-auto text-blue-800 dark:text-blue-300 font-medium">
                        {selectedService.rate.toLocaleString()} UZS/мин
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Service Selection */}
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Выберите услугу:
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {services.map((service) => (
                    <ServiceButton
                      key={service.name}
                      service={service}
                      isSelected={selectedService?.name === service.name}
                      onSelect={selectService}
                      disabled={status === "Работает"}
                      icon={service.icon}
                    />
                  ))}
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex gap-4">
                <Button
                  className="flex-1 py-6 text-base font-medium shadow-md transition-all duration-200"
                  variant={
                    !selectedService || status === "Работает"
                      ? "outline"
                      : "default"
                  }
                  disabled={!selectedService || status === "Работает"}
                  onClick={startService}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Старт
                </Button>
                <Button
                  className="flex-1 py-6 text-base font-medium shadow-md transition-all duration-200"
                  variant={status !== "Работает" ? "outline" : "destructive"}
                  disabled={status !== "Работает"}
                  onClick={pauseService}
                >
                  <Pause className="mr-2 h-5 w-5" />
                  Пауза
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <Toaster richColors theme="system" position="top-center" />
    </ThemeProvider>
  );
}
