// api.ts
"use client";

import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from "axios";

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

const createApiClient = (): AxiosInstance => {
  const baseURL = import.meta.env.VITE_CONTROLLER_API || "";

  if (!baseURL && import.meta.env.PROD) {
    console.warn(
      "API URL is not configured. Set VITE_CONTROLLER_API environment variable."
    );
  }

  const instance = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
    timeout: 10000,
  });

  instance.interceptors.request.use(
    (config) => {
      const url = config.url || "";
      config.url = url + (url.includes("?") ? "&" : "?") + "_t=" + Date.now();
      // if (import.meta.env.DEV) console.log(
      //   `[API] ${config.method?.toUpperCase()} ${config.url}`,
      //   config.data || ""
      // );
      return config;
    },
    (error) => {
      if (import.meta.env.DEV) console.error("[API] Request error:", error);
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response) => {
      // if (import.meta.env.DEV) console.log(
      //   `[API] Response (${response.status}):`,
      //   response.data
      // );
      return response;
    },
    (error: AxiosError) => {
      const apiError: ApiError = {
        status: error.response?.status || 500,
        message: error.message,
        data: error.response?.data,
      };
      if (import.meta.env.DEV) console.error(
        `[API] Error (${apiError.status}):`,
        apiError.message,
        apiError.data
      );
      return Promise.reject(apiError);
    }
  );

  return instance;
};

const apiClient = createApiClient();

export const useCrud = () => ({
  async get<T>({ url, params, timeout }: Omit<RequestProps, "data" | "contentType">) {
    const config: AxiosRequestConfig = { params };
    if (timeout) config.timeout = timeout;
    const response = await apiClient.get<T>(url, config);
    return { status: response.status, data: response.data };
  },
  async create<T>({ url, data, params, contentType = "application/json", timeout }: RequestProps) {
    const config: AxiosRequestConfig = { headers: { "Content-Type": contentType }, params };
    if (timeout) config.timeout = timeout;
    const response = await apiClient.post<T>(url, data, config);
    return { status: response.status, data: response.data };
  },
  async update<T>({ url, data, params, contentType = "application/json", timeout }: RequestProps) {
    const config: AxiosRequestConfig = { headers: { "Content-Type": contentType }, params };
    if (timeout) config.timeout = timeout;
    const response = await apiClient.put<T>(url, data, config);
    return { status: response.status, data: response.data };
  },
  async patch<T>({ url, data, params, contentType = "application/json", timeout }: RequestProps) {
    const config: AxiosRequestConfig = { headers: { "Content-Type": contentType }, params };
    if (timeout) config.timeout = timeout;
    const response = await apiClient.patch<T>(url, data, config);
    return { status: response.status, data: response.data };
  },
  async delete<T = null>({ url, params, timeout }: Omit<RequestProps, "data" | "contentType">) {
    const config: AxiosRequestConfig = { params };
    if (timeout) config.timeout = timeout;
    const response = await apiClient.delete<T>(url, config);
    return { status: response.status, data: response.data };
  }
});

export const useApi = () => useCrud();
