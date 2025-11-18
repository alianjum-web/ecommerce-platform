// store/useAuthStore.ts - FIXED VERSION
import axios from "axios";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "SUPER_ADMIN";
};

type AuthStore = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  fetchMe: () => Promise<User | null>;
  clearError: () => void;
};

const getBaseURL = () => {
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:4001/api/auth'
    : 'api/auth';
};

// Create axios instance WITHOUT interceptor first
const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  timeout: 10000,
});

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      clearError: () => set({ error: null }),

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axiosInstance.post("/register", { name, email, password });
          set({ isLoading: false });
          return response.data.userId;
        } catch (error) {
          const errorMessage = axios.isAxiosError(error)
            ? error.response?.data?.error || "Registration failed"
            : "Registration failed";
          set({ isLoading: false, error: errorMessage });
          return null;
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          console.log("🔄 Login attempt started");
          
          const response = await axiosInstance.post("/login", { email, password });
          console.log("✅ Login response:", response.data);

          if (response.data.success && response.data.user) {
            set({ isLoading: false, user: response.data.user, error: null });
            return true;
          } else {
            const errorMsg = response.data.error || "Login failed";
            set({ isLoading: false, error: errorMsg });
            return false;
          }
        } catch (error: any) {
          console.error("❌ Login error:", error);
          const errorMessage = axios.isAxiosError(error)
            ? error.response?.data?.error || error.message || "Login failed"
            : "Login failed";
          set({ isLoading: false, error: errorMessage });
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          await axiosInstance.post("/logout");
        } catch (error) {
          // Ignore API errors during logout
        } finally {
          // Always clear local state
          set({ user: null, isLoading: false, error: null });
        }
      },

      refreshAccessToken: async () => {
        try {
          console.log("🔄 Attempting token refresh...");
          const res = await axiosInstance.post("/refresh-token");
          
          if (res.data.success) {
            console.log("✅ Token refresh successful");
            return true;
          }
          return false;
        } catch (e) {
          console.error("❌ Token refresh failed:", e);
          return false;
        }
      },

      fetchMe: async () => {
        try {
          const res = await axiosInstance.get("/me");
          if (res.data.user) {
            set({ user: res.data.user, error: null });
            return res.data.user;
          }
          return null;
        } catch (error) {
          console.error("Fetch me failed:", error);
          return null;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// ✅ NOW add the interceptor AFTER the store is created
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      
      try {
        const refreshSuccess = await useAuthStore.getState().refreshAccessToken();
        
        if (refreshSuccess) {
          // Retry the original request with new token
          return axiosInstance(error.config);
        }
      } catch (refreshError) {
        console.error("Token refresh in interceptor failed:", refreshError);
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);