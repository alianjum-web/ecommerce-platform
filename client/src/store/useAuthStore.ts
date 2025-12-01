// src/store/useAuthStore.ts - FIXED VERSION
import axios from "axios";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { warmupService } from "@/utils/warmupService";
import { session } from "@/types/session";

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
  checkSession: () => Promise<session | null>;
  clearError: () => void;
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void; 
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

      setUser: (user: User | null) => set({ user }),
      isAuthenticated: () => {
        const state = get();
        return !!state.user;
      },

      // Get user role safely
      getUserRole: () => {
        const state = get();
        return state.user?.role || null;
      },

      // Reset auth state without making API calls
      reset: () => {
        set({
          user: null,
          isLoading: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),

      initialize: async () => {
        if (typeof window === "undefined") return;

        try {
          if (process.env.NODE_ENV === "development") {
            console.log("🔧 AuthStore: Initializing auth state...");
          }

          // ✅ CHECK SESSION FIRST (more reliable than direct fetchMe)
          const sessionData = await get().checkSession();

          if (sessionData?.hasRefreshToken) {
            if (process.env.NODE_ENV === "development") {
              console.log(
                "🔄 AuthStore: Refresh token found, attempting refresh..."
              );
            }

            // Try to refresh token to get fresh user data
            const refreshSuccess = await get().refreshAccessToken();

            if (!refreshSuccess && sessionData.hasAccessToken) {
              // If refresh failed but we have access token, try direct fetch
              if (process.env.NODE_ENV === "development") {
                console.log(
                  "🔧 AuthStore: Token refresh failed, trying direct fetch..."
                );
              }
              await get().fetchMe();
            }
          } else {
            if (process.env.NODE_ENV === "development") {
              console.log("🔐 AuthStore: No valid session found");
            }
          }
        } catch (error) {
          console.error("AuthStore: Initialization error:", error);
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
          if (process.env.NODE_ENV === "development") {
            console.log("🔄 AuthStore: Login process started for:", email);
          }

          // 🔥 CRITICAL: Ensure backend is warm before login
          await warmupService.ensureWarm();

          const response = await axiosInstance.post("/login", {
            email,
            password,
          });

          if (response.data.success && response.data.user) {
            if (process.env.NODE_ENV === "development") {
              console.log("✅ AuthStore: Login SUCCESS for:", email);
            }

            set({
              isLoading: false,
              user: response.data.user,
              error: null,
            });
            return true;
          } else {
            // Handle cases where backend returns success: false
            const errorMessage = response.data.error || "Login failed";
            throw new Error(errorMessage);
          }
        } catch (error: any) {
          // ✅ IMPROVED ERROR EXTRACTION
          const errorMessage = axios.isAxiosError(error)
            ? error.response?.data?.error || error.message || "Login failed"
            : error.message || "Login failed";

          console.error(
            "❌ AuthStore: Login failed for",
            email,
            ":",
            errorMessage
          );

          set({
            isLoading: false,
            error: errorMessage,
          });
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
          if (process.env.NODE_ENV === "development") {
            console.log("🔄 AuthStore: Attempting token refresh...");
          }

          const res = await axiosInstance.post("/refresh-token");

          if (res.data.success) {
            if (process.env.NODE_ENV === "development") {
              console.log("✅ AuthStore: Token refresh successful");
            }

            if (res.data.user) {
              set({ user: res.data.user, error: null });
            }
            return true;
          }

          // If backend says refresh failed but returned success: false
          if (process.env.NODE_ENV === "development") {
            console.warn("❌ AuthStore: Token refresh returned false");
          }
          return false;
        } catch (error: any) {
          console.error("❌ AuthStore: Token refresh failed:", error);

          // ✅ IMPROVED ERROR HANDLING
          if (error.response?.status === 401) {
            if (process.env.NODE_ENV === "development") {
              console.log(
                "🔄 AuthStore: Refresh token invalid, clearing session"
              );
            }
            get().logout();
          } else if (error.code === "NETWORK_ERROR" || !error.response) {
            // Network errors - don't logout, just return false
            if (process.env.NODE_ENV === "development") {
              console.log("🌐 AuthStore: Network error during token refresh");
            }
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

          // If no user in response but request succeeded
          if (process.env.NODE_ENV === "development") {
            console.warn("🔍 AuthStore: fetchMe succeeded but no user data");
          }
          return null;
        } catch (error: any) {
          // ✅ BETTER ERROR CATEGORIZATION
          if (error.response?.status === 401) {
            if (process.env.NODE_ENV === "development") {
              console.log(
                "🔐 AuthStore: fetchMe - Unauthorized (likely expired token)"
              );
            }
          } else if (error.response?.status === 404) {
            if (process.env.NODE_ENV === "development") {
              console.log("🔍 AuthStore: fetchMe - User not found");
            }
          } else {
            console.error("AuthStore: fetchMe failed:", error);
          }

          return null;
        }
      },
      checkSession: async () => {
        try {
          const res = await axiosInstance.get("/check-session");

          if (process.env.NODE_ENV === "development") {
            console.log("🔍 AuthStore: Session check result:", res.data);
          }

          // ✅ ENSURE CONSISTENT RESPONSE FORMAT
          return {
            success: res.data.success ?? true,
            hasRefreshToken: res.data.hasRefreshToken ?? false,
            hasAccessToken: res.data.hasAccessToken ?? false,
            cookiesPresent: res.data.cookiesPresent ?? [],
            ...res.data,
          };
        } catch (error) {
          console.error("AuthStore: Session check failed:", error);

          // ✅ RETURN CONSISTENT ERROR FORMAT
          return {
            success: false,
            hasRefreshToken: false,
            hasAccessToken: false,
            cookiesPresent: [],
            error: "Session check failed",
          };
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

// ✅ IMPROVED: Response interceptor with production logging
axiosInstance.interceptors.response.use(
  (response) => {
    // Optional: Log successful auth API calls in development
    if (
      process.env.NODE_ENV === "development" &&
      response.config.url?.includes("/auth/")
    ) {
      console.log(
        `✅ API ${response.config.method?.toUpperCase()} ${
          response.config.url
        }: ${response.status}`
      );
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Only retry for 401 errors and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (process.env.NODE_ENV === "development") {
        console.log("🔄 Interceptor: Token expired, attempting refresh...");
      }

      try {
        const refreshSuccess = await useAuthStore
          .getState()
          .refreshAccessToken();

        if (refreshSuccess) {
          if (process.env.NODE_ENV === "development") {
            console.log(
              "✅ Interceptor: Token refresh successful, retrying request"
            );
          }
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        console.error("❌ Interceptor: Token refresh failed", refreshError);
        useAuthStore.getState().logout();
      }
    }

    // Log other errors
    if (error.response?.status >= 500) {
      console.error(
        "🚨 Server error:",
        error.response.status,
        error.config.url
      );
    }

    return Promise.reject(error);
  }
);
