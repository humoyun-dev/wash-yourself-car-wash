// src/utils/websocket-utils.ts

import { WebSocketMessage } from "@/types/types";

export const initializeWebSocket = (
  url: string,
  messageHandler: (message: WebSocketMessage) => void,
  onStatusChange: (connected: boolean) => void
): WebSocket => {
  const ws = new WebSocket(url);

  ws.onopen = () => {
    onStatusChange(true);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as WebSocketMessage;
      messageHandler(data);
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    onStatusChange(false);
  };

  ws.onclose = () => {
    onStatusChange(false);
  };

  return ws;
};

export const handleWebSocketMessage = (
  message: WebSocketMessage,
  handlers: {
    onBalanceUpdate: (balance: number) => void;
    onProgramUpdate: () => void;
    onSessionEnd: () => void;
  }
) => {
  switch (message.t) {
    case "balance_update": {
      const balance = parseFloat(message.p.balance);
      if (!isNaN(balance)) handlers.onBalanceUpdate(balance);
      break;
    }
    case "program_selected":
    case "program_started":
    case "program_paused":
      handlers.onProgramUpdate();
      break;
    case "session_finished":
      handlers.onSessionEnd();
      break;
    default:
      handlers.onProgramUpdate();
  }
};
