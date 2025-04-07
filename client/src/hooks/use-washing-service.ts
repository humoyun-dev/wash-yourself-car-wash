"use client";

import { useState, useEffect, useCallback } from "react";

type ServiceStatus =
  | "Простой"
  | "Работает"
  | "Приостановлено"
  | "Готов к запуску";

interface Service {
  name: string;
  rate: number;
}

export function useWashingService() {
  const initialBalance = 1000;
  const [balance, setBalance] = useState(initialBalance);
  const [status, setStatus] = useState<ServiceStatus>("Простой");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [timerInterval, setTimerIntervalState] = useState<number | null>(null);
  const [showAlert, setShowAlert] = useState<string | null>(null);
  const [maxTime, setMaxTime] = useState(0);

  // Format time as M:SS
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const selectService = useCallback(
    (service: Service) => {
      if (status === "Работает") {
        setShowAlert("Остановите текущую услугу перед выбором новой.");
        return;
      }

      setSelectedService(service);

      // Calculate maximum time based on balance
      const maxTime = Math.floor((balance * 60) / service.rate);
      setTimeRemaining(maxTime);
      setMaxTime(maxTime);

      setStatus("Готов к запуску");
    },
    [status, balance]
  );

  const startService = useCallback(() => {
    if (!selectedService) {
      setShowAlert("Пожалуйста, сначала выберите услугу.");
      return;
    }

    if (timerInterval !== null) {
      clearInterval(timerInterval);
    }

    setStatus("Работает");

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          setTimerIntervalState(null);
          setStatus("Простой");
          setSelectedService(null);
          setShowAlert("Время услуги истекло или недостаточно средств.");
          return 0;
        }
        return prev - 1;
      });

      setBalance((prev) => {
        const newBalance = prev - selectedService.rate / 60;
        const roundedBalance = Math.round(newBalance);

        // If balance is less than 40, set to 0 and stop service
        if (roundedBalance < 40) {
          clearInterval(interval);
          setTimerIntervalState(null);
          setStatus("Простой");
          setSelectedService(null);
          setShowAlert("Недостаточно средств на балансе. Услуга остановлена.");
          return 0;
        }

        return roundedBalance;
      });
    }, 1000);

    // @ts-ignore
    setTimerIntervalState(interval);
  }, [selectedService, timerInterval]);

  const pauseService = useCallback(() => {
    if (status !== "Работает") return;

    if (timerInterval !== null) {
      clearInterval(timerInterval);
      setTimerIntervalState(null);
    }

    setStatus("Приостановлено");
  }, [status, timerInterval]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (timerInterval !== null) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  return {
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
  };
}
