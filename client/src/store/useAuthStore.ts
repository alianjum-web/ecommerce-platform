// src/store/useAuthStore.ts - FIXED VERSION
import axios from "axios";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { warmupService } from "@/utils/warmupService";

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
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<string | null>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  fetchMe: () => Promise<User | null>;
  clearError: () => void;
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void; // ✅ ADDED THIS METHOD
};

const getBaseURL = () => "/api/auth";

// Create axios instance FIRST
const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  timeout: 15000,
});

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      // ✅ ADDED: setUser method
      setUser: (user: User | null) => set({ user }),

      clearError: () => set({ error: null }),

      initialize: async () => {
        if (typeof window === "undefined") return;
        try {
          // console.log("🔧 Initializing auth state...");
          const user = await get().fetchMe();
          if (user) {
            // console.log("🔧 User found on initialization:", user);
            set({ user });
          }
        } catch (error) {
          // console.log("🔧 No authenticated user found");
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axiosInstance.post("/register", {
            name,
            email,
            password,
          });
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
          // console.log("🔄 Login process started");

          // 🔥 CRITICAL: Ensure backend is warm before login
          await warmupService.ensureWarm();

          const response = await axiosInstance.post("/login", {
            email,
            password,
          });

          if (response.data.success && response.data.user) {
            // console.log("✅ Login SUCCESS - User data:", response.data.user);
            set({
              isLoading: false,
              user: response.data.user,
              error: null,
            });
            return true;
          } else {
            throw new Error(response.data.error || "Login failed");
          }
        } catch (error: any) {
          // console.error("❌ Login error:", error);
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

      // ✅ FIXED: refreshAccessToken method
      refreshAccessToken: async () => {
        try {
          console.log("🔄 Attempting token refresh...");

          const res = await axiosInstance.post("/refresh-token");

          if (res.data.success) {
            console.log("✅ Token refresh successful");

            // ✅ FIX: Use the set method directly instead of setUser
            if (res.data.user) {
              set({ user: res.data.user });
            }

            return true;
          } else {
            console.warn("❌ Token refresh returned false");
            // Clear invalid session
            get().logout();
            return false;
          }
        } catch (error: any) {
          console.error("❌ Token refresh failed:", error);

          // If it's a 401, clear the session
          if (error.response?.status === 401) {
            console.log("🔄 Refresh token invalid, clearing session");
            get().logout();
          }

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
          // console.error("Fetch me failed:", error);
          return null;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        // console.log("🔄 Storage rehydrated:", state?.user);
      },
    }
  )
);

// ✅ FIXED: Response interceptor - define AFTER store creation
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only retry for 401 errors and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // console.log("🔄 Interceptor: Token expired, attempting refresh...");

      try {
        const refreshSuccess = await useAuthStore
          .getState()
          .refreshAccessToken();
        if (refreshSuccess) {
          // console.log("✅ Interceptor: Token refresh successful, retrying request");
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // console.error("❌ Interceptor: Token refresh failed", refreshError);
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  }
);
