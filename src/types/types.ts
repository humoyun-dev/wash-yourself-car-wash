// src/types.ts
export interface WashProgram {
  id: string;
  name: string;
  price_per_second: string;
  icon?: string;
}

export interface KioskStatusResponse {
  kiosk_state: number;
  session_id: string | null;
  session_state: SessionState | null;
  balance: number | null;
  programs: WashProgram[];
}

export type SessionState =
  | "IDLE"
  | "AWAITING_PAYMENT"
  | "READY"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "AWAITING_SELECTION";

export interface WebSocketMessage {
  t: string;
  p: any;
}

export interface BalanceAddedPayload {
  amount: string;
  balance_state: SessionState;
}

export interface BalanceUpdatePayload {
  balance: string;
  session_state: SessionState;
}

export interface PersistedState {
  selectedProgramId: string | null;
  isRunning: boolean;
}

export interface RequestProps<T = any> {
  url: string;
  data?: T;
  params?: Record<string, any>;
  contentType?: "multipart/form-data" | "application/json";
  timeout?: number;
}

export interface ApiResponse<T> {
  status: number;
  data: T;
}

export interface ApiError {
  status: number;
  message: string;
  data?: any;
}
