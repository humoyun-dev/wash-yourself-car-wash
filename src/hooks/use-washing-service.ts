import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useApi } from "./use-post";
// import { useNavigate } from "react-router";

// Updated API response types based on the new structure
interface WashProgram {
  id: string;
  name: string;
  price_per_second: string;
  icon?: string; // Added for UI display
}

interface KioskStatusResponse {
  kiosk_state: number;
  session_id: string | null;
  session_state: SessionState | null;
  balance: number | null;
  programs: WashProgram[];
}

type SessionState =
  | "IDLE"
  | "AWAITING_PAYMENT"
  | "READY"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "AWAITING_SELECTION";

// WebSocket message types
interface WebSocketMessage {
  t: string; // message type
  p: any; // message payload
}

interface BalanceAddedPayload {
  amount: string;
  balance_state: SessionState;
}

interface BalanceUpdatePayload {
  balance: string;
  session_state: SessionState;
}

export function useWashingService() {
  const api = useApi();
  const [balance, setBalance] = useState(0);
  const [initialBalance, setInitialBalance] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedProgram, setSelectedProgram] = useState<WashProgram | null>(
    null
  );

  // const router = useNavigate();

  const [isRunning, setIsRunning] = useState(false);
  const [showAlert, setShowAlert] = useState<string | null>(null);
  const [maxTime, setMaxTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [programs, setPrograms] = useState<WashProgram[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currencySymbol, setCurrencySymbol] = useState("UZS");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const calculateTimeRemaining = useCallback(
    (currentBalance: number, program: WashProgram | null) => {
      if (!program) return 0;
      const ratePerSecond = Number.parseFloat(program.price_per_second);
      if (isNaN(ratePerSecond) || ratePerSecond <= 0) return 0;
      return Math.floor(currentBalance / ratePerSecond);
    },
    []
  );

  const status = useMemo(() => {
    if (balance <= 0) return "Простой";
    return isRunning ? "Работает" : "Готов к запуску";
  }, [isRunning, balance]);

  const processStatusUpdate = useCallback(
    (data: KioskStatusResponse) => {
      if (data.programs && Array.isArray(data.programs)) {
        setPrograms(data.programs);
      }

      if (data.session_id) {
        setSessionId(data.session_id);
      }

      if (data.balance !== null && data.balance !== undefined) {
        setBalance(data.balance);

        if (!initialBalance || initialBalance < data.balance) {
          setInitialBalance(data.balance);
        }

        if (selectedProgram) {
          const remaining = calculateTimeRemaining(
            data.balance,
            selectedProgram
          );
          setTimeRemaining(remaining);
        }
      }
    },
    [calculateTimeRemaining, initialBalance, selectedProgram]
  );

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get<KioskStatusResponse>({
        url: "/api/status",
      });

      processStatusUpdate(response.data);

      setIsInitialized(true);
      setRetryCount(0);
      setIsLoading(false);

      if (
        !wsConnected &&
        (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
      ) {
        console.log("Initializing WebSocket after status fetch");
        initializeWebSocket();
      }
    } catch (error) {
      console.error("Failed to fetch status:", error);
      setIsLoading(false);

      if (!isInitialized) {
        setShowAlert(
          "Не удалось получить статус. Пожалуйста, обновите страницу."
        );
      }

      if (retryCount < MAX_RETRIES) {
        setRetryCount((prev) => prev + 1);
        setTimeout(() => fetchStatus(), 1000 * Math.pow(2, retryCount));
      }
    }
  }, [api, processStatusUpdate, isInitialized, retryCount, wsConnected]);

  const processWebSocketMessage = useCallback(
    (message: WebSocketMessage) => {
      console.log("Processing WebSocket message:", message);

      try {
        switch (message.t) {
          case "balance_added": {
            const payload = message.p as BalanceAddedPayload;
            const amount = parseFloat(payload.amount);

            if (!isNaN(amount)) {
              setBalance((prev) => {
                const newBalance = prev + amount;
                if (!initialBalance || newBalance > initialBalance) {
                  setInitialBalance(newBalance);
                }
                return newBalance;
              });

              setShowAlert(
                `Добавлено ${amount.toLocaleString()} ${currencySymbol}`
              );
            }

            break;
          }

          case "balance_update": {
            const payload = message.p as BalanceUpdatePayload;

            if (payload && payload.balance) {
              const newBalance = parseFloat(payload.balance);

              if (!isNaN(newBalance)) {
                console.log(`Updating balance from WebSocket: ${newBalance}`);
                setBalance(newBalance);

                if (!initialBalance || newBalance > initialBalance) {
                  setInitialBalance(newBalance);
                }

                if (selectedProgram) {
                  const remaining = calculateTimeRemaining(
                    newBalance,
                    selectedProgram
                  );
                  setTimeRemaining(remaining);
                }
              }
            }

            break;
          }

          case "program_selected": {
            fetchStatus();
            break;
          }

          case "program_started": {
            fetchStatus();
            break;
          }

          case "program_paused": {
            fetchStatus();
            break;
          }

          case "session_finished": {
            setSelectedProgram(null);
            fetchStatus();
            break;
          }

          case "balance_updated":
          case "status_update":
          default:
            console.log(
              "Unknown or generic WebSocket message type:",
              message.t
            );
            fetchStatus();
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
        fetchStatus();
      }
    },
    [
      fetchStatus,
      initialBalance,
      processStatusUpdate,
      calculateTimeRemaining,
      selectedProgram,
      currencySymbol,
    ]
  );

  const initializeWebSocket = useCallback(() => {
    if (wsRef.current) {
      console.log("Closing existing WebSocket connection");
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      const baseURL = import.meta.env.VITE_CONTROLLER_WS || "";
      const wsUrl = `ws://${baseURL}/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connection established");
        setWsConnected(true);
        setRetryCount(0);
      };

      ws.onmessage = (event) => {
        try {
          console.log("WebSocket message received:", event.data);
          const data = JSON.parse(event.data) as WebSocketMessage;
          processWebSocketMessage(data);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setWsConnected(false);
      };

      ws.onclose = (event) => {
        console.log("WebSocket connection closed:", event.code, event.reason);
        setWsConnected(false);

        if (isInitialized) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (retryCount < MAX_RETRIES) {
              console.log(
                `Attempting to reconnect WebSocket (retry ${
                  retryCount + 1
                }/${MAX_RETRIES})`
              );
              setRetryCount((prev) => prev + 1);
              initializeWebSocket();
            } else {
              console.warn("Max WebSocket reconnection attempts reached.");
              setShowAlert(
                "Потеряно соединение с сервером. Пожалуйста, обновите страницу."
              );

              setTimeout(() => {
                setRetryCount(0);
              }, 30000);
            }
          }, 1000 * Math.pow(2, retryCount));
        }
      };
    } catch (error) {
      console.error("Failed to initialize WebSocket:", error);
      setWsConnected(false); // Ensure connection status is false
    }
  }, [processWebSocketMessage, isInitialized, retryCount]);

  // Start a session
  const startSession = useCallback(async () => {
    try {
      setIsLoading(true);
      await api.create({ url: "/api/actions/start_session", data: {} });
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

  // Select a program - Updated endpoint
  const selectProgram = useCallback(
    async (program: WashProgram) => {
      // if (status === "Работает") {
      //   setShowAlert("Остановите текущую услугу перед выбором новой.");
      //   return;
      // }

      try {
        setIsLoading(true);
        await api.create({
          url: "/api/actions/select_program", // Updated endpoint
          data: { program_id: program.id },
        });
        setIsRunning(true);

        // Update local state immediately for better UX
        setSelectedProgram(program);
        const remaining = calculateTimeRemaining(balance, program);
        setTimeRemaining(remaining);
        setMaxTime(Math.max(maxTime, remaining));

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
    [api, balance, calculateTimeRemaining, status, retryCount, maxTime]
  );

  // Start the selected program - Updated endpoint
  const startProgram = useCallback(async () => {
    if (!selectedProgram) {
      setShowAlert("Пожалуйста, сначала выберите программу.");
      return;
    }

    try {
      setIsLoading(true);
      // The API doesn't have a specific start endpoint, so we'll select the program again
      await api.create({
        url: "/api/actions/select_program", // Updated endpoint
        data: { program_id: selectedProgram.id },
      });

      setIsRunning(true);

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
  }, [api, selectedProgram, retryCount]);

  // Pause the active program - Updated endpoint
  const pauseProgram = useCallback(async () => {
    try {
      setIsLoading(true);
      await api.create({
        url: "/api/actions/pause", // Updated endpoint
        data: {},
      });

      // setStatus("Приостановлено");

      setIsRunning(false);

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
  }, [api, status, retryCount]);

  // Finish the current session - Updated endpoint
  const finishSession = useCallback(async () => {
    setTimeRemaining(0);
    setBalance(0);
    try {
      setIsLoading(true);
      await api.create({
        url: "/api/actions/finish", // Updated endpoint
        data: {},
      });
      
      setSelectedProgram(null);
      // setStatus("Простой");
      setIsRunning(false);
      setBalance(0);
      setTimeRemaining(0);
      setIsLoading(false);
    } catch (error) {
      setBalance(0);
      console.error("Failed to finish session:", error);
      setShowAlert(
        "Не удалось завершить сессию. Пожалуйста, попробуйте позже."
      );
      setIsLoading(false);

      if (retryCount < MAX_RETRIES) {
        setRetryCount((prev) => prev + 1);
        setBalance(0);
        setTimeout(() => finishSession(), 1000 * Math.pow(2, retryCount));
      }
    }
  }, [api, retryCount]);

  const creditToLoyaltyCard = useCallback(
    async (cardId: string) => {
      try {
        setIsLoading(true);
        await api.create({
          url: "/api/actions/credit_loyalty", // Updated endpoint
          data: { card_id: cardId },
        });

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
    [api, retryCount]
  );

  // Decline crediting to loyalty card - Updated endpoint
  const declineCredit = useCallback(async () => {
    try {
      setIsLoading(true);
      await api.create({
        url: "/api/actions/decline_credit", // Updated endpoint
        data: {},
      });

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
  }, [api, retryCount]);

  // Initialize data on component mount - only runs once
  useEffect(() => {
    // Initial data fetch via HTTP
    console.log("Component mounted - fetching initial status");
    fetchStatus();

    // Clean up WebSocket connection on unmount
    return () => {
      console.log("Component unmounting - cleaning up connections");
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Manual refresh - forces an HTTP request
  const refreshStatus = useCallback(() => {
    console.log("Manual refresh requested");
    fetchStatus();
  }, [fetchStatus]);

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
    refreshStatus,
    wsConnected,
    setBalance,
  };
}
