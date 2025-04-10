"use client";

import { useState, useEffect, useCallback } from "react";
import { useApi } from "./use-post";

// API response types based on the provided endpoints
interface SessionData {
  session_id: string;
  state: SessionState;
  balance: number;
  current_program_id: string | null;
  last_activity_timestamp: string;
  wash_start_time: string | null;
}

type SessionState =
  | "IDLE"
  | "AWAITING_PAYMENT"
  | "READY"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED";

interface WashProgram {
  id: string;
  name: string;
  price_per_second: string;
  icon?: string; // Added for UI display
}

interface KioskConfiguration {
  kiosk_id: string;
  programs: WashProgram[];
  currency_symbol: string;
  idle_timeout_seconds: number;
  payment_timeout_seconds: number;
  show_advertisements: boolean;
}

interface KioskStatusResponse {
  operational_state: string;
  session: SessionData | null;
  configuration: KioskConfiguration;
}

// Mapping API session states to our UI states
const mapSessionStateToUIState = (state: SessionState): string => {
  switch (state) {
    case "ACTIVE":
      return "Работает";
    case "PAUSED":
      return "Приостановлено";
    case "READY":
      return "Готов к запуску";
    case "IDLE":
    case "AWAITING_PAYMENT":
    case "COMPLETED":
    default:
      return "Простой";
  }
};

/**
 * Custom hook for managing the washing service functionality
 */
export function useWashingService() {
  const api = useApi();
  const [balance, setBalance] = useState(0);
  const [initialBalance, setInitialBalance] = useState(0);
  const [status, setStatus] = useState<string>("Простой");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedProgram, setSelectedProgram] = useState<WashProgram | null>(
    null
  );
  const [showAlert, setShowAlert] = useState<string | null>(null);
  const [maxTime, setMaxTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [programs, setPrograms] = useState<WashProgram[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("UZS");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Format time as M:SS
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Calculate time remaining based on balance and program rate
  const calculateTimeRemaining = useCallback(
    (currentBalance: number, program: WashProgram | null) => {
      if (!program) return 0;
      const ratePerSecond = Number.parseFloat(program.price_per_second);
      if (isNaN(ratePerSecond) || ratePerSecond <= 0) return 0;
      return Math.floor(currentBalance / ratePerSecond);
    },
    []
  );

  // Start a session
  const startSession = useCallback(async () => {
    try {
      setIsLoading(true);
      await api.create({ url: "/api/start_session", data: {} });
      await fetchStatus(); // Fetch status after starting session
      setIsLoading(false);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error("Failed to start session:", error);
      setShowAlert("Не удалось начать сессию. Пожалуйста, попробуйте позже.");
      setIsLoading(false);

      // Retry logic
      if (retryCount < MAX_RETRIES) {
        setRetryCount((prev) => prev + 1);
        setTimeout(() => startSession(), 1000 * Math.pow(2, retryCount)); // Exponential backoff
      }
    }
  }, [api, retryCount]);

  // Fetch kiosk status
  const fetchStatus = useCallback(async () => {
    try {
      const response = await api.get<KioskStatusResponse>({
        url: "/api/status",
      });

      // Update configuration
      if (response.data.configuration) {
        setPrograms(response.data.configuration.programs);
        setCurrencySymbol(response.data.configuration.currency_symbol);
      }

      // Update session data if available
      if (response.data.session) {
        const session = response.data.session;
        setSessionId(session.session_id);
        setBalance(session.balance);

        if (!initialBalance || initialBalance < session.balance) {
          setInitialBalance(session.balance);
        }

        setStatus(mapSessionStateToUIState(session.state));

        // Update selected program if there is one
        if (
          session.current_program_id &&
          response.data.configuration.programs
        ) {
          const currentProgram = response.data.configuration.programs.find(
            (p) => p.id === session.current_program_id
          );
          if (currentProgram) {
            setSelectedProgram(currentProgram);
            const remaining = calculateTimeRemaining(
              session.balance,
              currentProgram
            );
            setTimeRemaining(remaining);
            setMaxTime(Math.max(maxTime, remaining));
          }
        }
      } else if (!isInitialized) {
        // If no session and not initialized, start a new session
        await startSession();
      }

      setIsInitialized(true);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error("Failed to fetch status:", error);
      if (!isInitialized) {
        setShowAlert(
          "Не удалось получить статус. Пожалуйста, обновите страницу."
        );
      }

      // Retry logic
      if (retryCount < MAX_RETRIES) {
        setRetryCount((prev) => prev + 1);
        setTimeout(() => fetchStatus(), 1000 * Math.pow(2, retryCount)); // Exponential backoff
      }
    }
  }, [
    api,
    initialBalance,
    isInitialized,
    maxTime,
    calculateTimeRemaining,
    startSession,
    retryCount,
  ]);

  // Select a program
  const selectProgram = useCallback(
    async (program: WashProgram) => {
      if (status === "Работает") {
        setShowAlert("Остановите текущую услугу перед выбором новой.");
        return;
      }

      try {
        setIsLoading(true);
        await api.create({
          url: "/api/select_program",
          data: { program_id: program.id },
        });

        // Update local state
        setSelectedProgram(program);
        const remaining = calculateTimeRemaining(balance, program);
        setTimeRemaining(remaining);
        setMaxTime(remaining);

        // Fetch updated status
        await fetchStatus();
        setIsLoading(false);
        setRetryCount(0); // Reset retry count on success
      } catch (error) {
        console.error("Failed to select program:", error);
        setShowAlert(
          "Не удалось выбрать программу. Пожалуйста, попробуйте позже."
        );
        setIsLoading(false);

        // Retry logic
        if (retryCount < MAX_RETRIES) {
          setRetryCount((prev) => prev + 1);
          setTimeout(
            () => selectProgram(program),
            1000 * Math.pow(2, retryCount)
          ); // Exponential backoff
        }
      }
    },
    [api, balance, calculateTimeRemaining, fetchStatus, status, retryCount]
  );

  // Start the selected program
  const startProgram = useCallback(async () => {
    if (!selectedProgram) {
      setShowAlert("Пожалуйста, сначала выберите программу.");
      return;
    }

    try {
      setIsLoading(true);
      // The API doesn't have a specific start endpoint, so we'll select the program again
      await api.create({
        url: "/api/select_program",
        data: { program_id: selectedProgram.id },
      });

      // Fetch updated status
      await fetchStatus();
      setIsLoading(false);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error("Failed to start program:", error);
      setShowAlert(
        "Не удалось запустить программу. Пожалуйста, попробуйте позже."
      );
      setIsLoading(false);

      // Retry logic
      if (retryCount < MAX_RETRIES) {
        setRetryCount((prev) => prev + 1);
        setTimeout(() => startProgram(), 1000 * Math.pow(2, retryCount)); // Exponential backoff
      }
    }
  }, [api, fetchStatus, selectedProgram, retryCount]);

  // Pause the active program
  const pauseProgram = useCallback(async () => {
    if (status !== "Работает") return;

    try {
      setIsLoading(true);
      await api.create({
        url: "/api/pause",
        data: {},
      });

      // Fetch updated status
      await fetchStatus();
      setIsLoading(false);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error("Failed to pause program:", error);
      setShowAlert(
        "Не удалось приостановить программу. Пожалуйста, попробуйте позже."
      );
      setIsLoading(false);

      // Retry logic
      if (retryCount < MAX_RETRIES) {
        setRetryCount((prev) => prev + 1);
        setTimeout(() => pauseProgram(), 1000 * Math.pow(2, retryCount)); // Exponential backoff
      }
    }
  }, [api, fetchStatus, status, retryCount]);

  // Finish the current session
  const finishSession = useCallback(async () => {
    try {
      setIsLoading(true);
      await api.create({
        url: "/api/finish",
        data: {},
      });

      // Reset local state
      setSelectedProgram(null);
      setStatus("Простой");

      // Fetch updated status
      await fetchStatus();
      setIsLoading(false);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error("Failed to finish session:", error);
      setShowAlert(
        "Не удалось завершить сессию. Пожалуйста, попробуйте позже."
      );
      setIsLoading(false);

      // Retry logic
      if (retryCount < MAX_RETRIES) {
        setRetryCount((prev) => prev + 1);
        setTimeout(() => finishSession(), 1000 * Math.pow(2, retryCount)); // Exponential backoff
      }
    }
  }, [api, fetchStatus, retryCount]);

  // Credit remaining balance to loyalty card
  const creditToLoyaltyCard = useCallback(
    async (cardId: string) => {
      try {
        setIsLoading(true);
        await api.create({
          url: "/api/credit_loyalty",
          data: { card_id: cardId },
        });

        // Fetch updated status
        await fetchStatus();
        setIsLoading(false);
        setRetryCount(0); // Reset retry count on success
      } catch (error) {
        console.error("Failed to credit to loyalty card:", error);
        setShowAlert(
          "Не удалось зачислить баланс на карту лояльности. Пожалуйста, попробуйте позже."
        );
        setIsLoading(false);

        // Retry logic
        if (retryCount < MAX_RETRIES) {
          setRetryCount((prev) => prev + 1);
          setTimeout(
            () => creditToLoyaltyCard(cardId),
            1000 * Math.pow(2, retryCount)
          ); // Exponential backoff
        }
      }
    },
    [api, fetchStatus, retryCount]
  );

  // Decline crediting to loyalty card
  const declineCredit = useCallback(async () => {
    try {
      setIsLoading(true);
      await api.create({
        url: "/api/decline_credit",
        data: {},
      });

      // Fetch updated status
      await fetchStatus();
      setIsLoading(false);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error("Failed to decline credit:", error);
      setShowAlert(
        "Не удалось отклонить зачисление. Пожалуйста, попробуйте позже."
      );
      setIsLoading(false);

      // Retry logic
      if (retryCount < MAX_RETRIES) {
        setRetryCount((prev) => prev + 1);
        setTimeout(() => declineCredit(), 1000 * Math.pow(2, retryCount)); // Exponential backoff
      }
    }
  }, [api, fetchStatus, retryCount]);

  // Initialize data on component mount
  useEffect(() => {
    fetchStatus();

    // Set up polling for status updates
    const statusInterval = setInterval(() => {
      if (isInitialized) {
        fetchStatus();
      }
    }, 3000);

    return () => {
      clearInterval(statusInterval);
    };
  }, [fetchStatus, isInitialized]);

  return {
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
    maxTime,
    isLoading,
    programs,
    currencySymbol,
    finishSession,
    creditToLoyaltyCard,
    declineCredit,
    sessionId,
    refreshStatus: fetchStatus,
  };
}
