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

// ✅ FIXED: Proper base URL configuration
const getBaseURL = () => {
  // if (typeof window === 'undefined') {
  //   // Server-side: use absolute URL
  //   return process.env.NODE_ENV === 'development' 
  //     ? `${process.env.DEVE_URL}/api/auth`
  //     : `${process.env.NEXT_PUBLIC_API_URL|| ''}/api/auth`;
  // } else {
    // Client-side: use relative URL to your Next.js API routes
    return '/api/auth';
  // }
};

console.log("Base URL:", getBaseURL());

// Create axios instance
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
        } catch (error: any) {
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
          console.log("Making request to:", `${axiosInstance.defaults.baseURL}/login`);
          
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
          console.error("Error details:", {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            url: error.config?.url
          });
          
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
          console.error("Logout error:", error);
        } finally {
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

// Add interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshSuccess = await useAuthStore.getState().refreshAccessToken();
        
        if (refreshSuccess) {
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh in interceptor failed:", refreshError);
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);