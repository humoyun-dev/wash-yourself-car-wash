"use client";

import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";

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

/**
 * Creates and configures the API client with proper interceptors and error handling
 */
const createApiClient = (): AxiosInstance => {
  // Get API URL from environment variable or use a default
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

  // Request interceptor for logging and request modification
  instance.interceptors.request.use(
    (config) => {
      // Add timestamp to prevent caching
      const url = config.url || "";
      config.url = url + (url.includes("?") ? "&" : "?") + "_t=" + Date.now();

      // Log requests in development
      if (import.meta.env.DEV) {
        console.log(
          `[API] ${config.method?.toUpperCase()} ${config.url}`,
          config.data || ""
        );
      }

      return config;
    },
    (error) => {
      if (import.meta.env.DEV) {
        console.error("[API] Request error:", error);
      }
      return Promise.reject(error);
    }
  );

  // Response interceptor for logging and error handling
  instance.interceptors.response.use(
    (response) => {
      // Log responses in development
      if (import.meta.env.DEV) {
        console.log(`[API] Response (${response.status}):`, response.data);
      }
      return response;
    },
    (error: AxiosError) => {
      // Format error for consistent handling
      const apiError: ApiError = {
        status: error.response?.status || 500,
        message: error.message,
        data: error.response?.data,
      };

      // Log errors in development
      if (import.meta.env.DEV) {
        console.error(
          `[API] Error (${apiError.status}):`,
          apiError.message,
          apiError.data
        );
      }

      return Promise.reject(apiError);
    }
  );

  return instance;
};

// Create a singleton instance of the API client
const apiClient = createApiClient();

/**
 * Hook for making API requests with proper error handling and response formatting
 */
export const useCrud = () => {
  return {
    /**
     * Make a GET request to the API
     */
    async get<T>({
      url,
      params,
      timeout,
    }: Omit<RequestProps, "data" | "contentType">): Promise<ApiResponse<T>> {
      try {
        const config: AxiosRequestConfig = { params };
        if (timeout) config.timeout = timeout;

        const response: AxiosResponse<T> = await apiClient.get(url, config);
        return { status: response.status, data: response.data };
      } catch (error) {
        if (error instanceof AxiosError) {
          throw error;
        }
        throw new Error(String(error));
      }
    },

    /**
     * Make a POST request to the API
     */
    async create<T>({
      url,
      data,
      params,
      contentType = "application/json",
      timeout,
    }: RequestProps): Promise<ApiResponse<T>> {
      try {
        const config: AxiosRequestConfig = {
          headers: { "Content-Type": contentType },
          params,
        };
        if (timeout) config.timeout = timeout;

        const response: AxiosResponse<T> = await apiClient.post(
          url,
          data,
          config
        );
        return { status: response.status, data: response.data };
      } catch (error) {
        if (error instanceof AxiosError) {
          throw error;
        }
        throw new Error(String(error));
      }
    },

    /**
     * Make a PUT request to the API
     */
    async update<T>({
      url,
      data,
      params,
      contentType = "application/json",
      timeout,
    }: RequestProps): Promise<ApiResponse<T>> {
      try {
        const config: AxiosRequestConfig = {
          headers: { "Content-Type": contentType },
          params,
        };
        if (timeout) config.timeout = timeout;

        const response: AxiosResponse<T> = await apiClient.put(
          url,
          data,
          config
        );
        return { status: response.status, data: response.data };
      } catch (error) {
        if (error instanceof AxiosError) {
          throw error;
        }
        throw new Error(String(error));
      }
    },

    /**
     * Make a DELETE request to the API
     */
    async delete<T = null>({
      url,
      params,
      timeout,
    }: Omit<RequestProps, "data" | "contentType">): Promise<ApiResponse<T>> {
      try {
        const config: AxiosRequestConfig = { params };
        if (timeout) config.timeout = timeout;

        const response: AxiosResponse<T> = await apiClient.delete(url, config);
        return { status: response.status, data: response.data };
      } catch (error) {
        if (error instanceof AxiosError) {
          throw error;
        }
        throw new Error(String(error));
      }
    },

    /**
     * Make a PATCH request to the API
     */
    async patch<T>({
      url,
      data,
      params,
      contentType = "application/json",
      timeout,
    }: RequestProps): Promise<ApiResponse<T>> {
      try {
        const config: AxiosRequestConfig = {
          headers: { "Content-Type": contentType },
          params,
        };
        if (timeout) config.timeout = timeout;

        const response: AxiosResponse<T> = await apiClient.patch(
          url,
          data,
          config
        );
        return { status: response.status, data: response.data };
      } catch (error) {
        if (error instanceof AxiosError) {
          throw error;
        }
        throw new Error(String(error));
      }
    },
  };
};

/**
 * Convenience hook that returns the API client
 */
export const useApi = () => {
  return useCrud();
};
