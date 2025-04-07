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

const cApi = import.meta.env.VITE_CONTROLLER_API;

const createApiClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: cApi,
    headers: { "Content-Type": "application/json" },
    timeout: 10000,
  });

  instance.interceptors.request.use(
    (config) => {
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const apiError: ApiError = {
        status: error.response?.status || 500,
        message: error.message,
        data: error.response?.data,
      };
      return Promise.reject(apiError);
    }
  );

  return instance;
};

const apiClient = createApiClient();

export const useCrud = {
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
      throw error instanceof AxiosError ? error : new Error(String(error));
    }
  },

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
      throw error instanceof AxiosError ? error : new Error(String(error));
    }
  },

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

      const response: AxiosResponse<T> = await apiClient.put(url, data, config);
      return { status: response.status, data: response.data };
    } catch (error) {
      throw error instanceof AxiosError ? error : new Error(String(error));
    }
  },

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
      throw error instanceof AxiosError ? error : new Error(String(error));
    }
  },

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
      throw error instanceof AxiosError ? error : new Error(String(error));
    }
  },
};

export const useApi = () => {
  return useCrud;
};
