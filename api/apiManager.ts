import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { Alert } from "react-native";

// 1. Configuration
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://your-api.com/api/v1";

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Request Interceptor (Attach Token)
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // TODO: Get your token from storage (AsyncStorage, SecureStore, or Supabase)
      // const token = await SecureStore.getItemAsync("user_token");
      const token = null; // Replace with actual token logic

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error attaching token:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response Interceptor (Global Error Handling)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle standard HTTP errors
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        // Token expired? Redirect to login
        Alert.alert("Session Expired", "Please login again.");
        // router.replace('/login');
      } else if (status === 500) {
        Alert.alert("Server Error", "Something went wrong on our end.");
      }
    } else if (error.request) {
      // Network error (no response received)
      Alert.alert("Network Error", "Please check your internet connection.");
    }

    return Promise.reject(error);
  }
);

// 4. Wrapper Functions for Clean Usage
export const ApiManager = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.get<T>(url, config);
    return response.data;
  },

  post: async <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
  },

  put: async <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
  },

  // Expose the raw instance if needed
  client: apiClient,
};
