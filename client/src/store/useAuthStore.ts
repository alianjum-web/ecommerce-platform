// src/store/useAuthStore.ts - CORRECTED VERSION
import axios from "axios";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { warmupService } from "@/utils/warmupService";
import type { User } from "@/types/auth/User";
import type { TokenExpiryInfo } from "@/types/auth/TokenExpiryInfo";
import type { Session } from "@/types/auth/Session";

interface AuthStore {
  // State
  user: User | null;
  isLoading: boolean;
  error: string | null;
  tokenExpiry: TokenExpiryInfo | null;
  
  // Actions
  setUser: (user: User | null) => void;
  isAuthenticated: () => boolean;
  getUserRole: () => "USER" | "SUPER_ADMIN" | null;
  reset: () => void;
  clearError: () => void;
  initialize: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  getTokenExpiryInfo: () => {
    isValid: boolean;
    timeUntilExpiry: number;
    shouldRefresh: boolean;
  } | null;
  updateTokenExpiry: (tokenInfo: any) => void;
  clearTokenExpiry: () => void;
  fetchMe: () => Promise<User | null>;
  checkSession: () => Promise<Session>;
}

const getBaseURL = () => "/api/auth";

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  timeout: 15000,
});

// Track refresh attempts to prevent loops
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      isLoading: false,
      error: null,
      tokenExpiry: null,

      // Basic state actions
      setUser: (user: User | null) => set({ user }),
      
      isAuthenticated: () => {
        return !!get().user;
      },

      getUserRole: () => {
        return get().user?.role || null;
      },

      reset: () => {
        set({
          user: null,
          isLoading: false,
          error: null,
          tokenExpiry: null,
        });
        localStorage.removeItem("token_expiry");
      },

      clearError: () => set({ error: null }),

      // Token expiry management
      updateTokenExpiry: (tokenInfo: any) => {
        if (!tokenInfo?.accessTokenExpiresIn) return;
        
        const now = Date.now();
        const tokenExpiry: TokenExpiryInfo = {
          lastRefresh: now,
          expiresIn: tokenInfo.accessTokenExpiresIn * 1000,
          nextRefresh: now + (tokenInfo.accessTokenExpiresIn * 1000 * 0.8),
        };
        
        set({ tokenExpiry });
        localStorage.setItem('token_expiry', JSON.stringify(tokenExpiry));
      },

      clearTokenExpiry: () => {
        set({ tokenExpiry: null });
        localStorage.removeItem('token_expiry');
      },

      getTokenExpiryInfo: () => {
        const { tokenExpiry } = get();
        
        if (tokenExpiry) {
          const now = Date.now();
          return {
            isValid: now < tokenExpiry.lastRefresh + tokenExpiry.expiresIn,
            timeUntilExpiry: Math.max(
              0,
              tokenExpiry.lastRefresh + tokenExpiry.expiresIn - now
            ),
            shouldRefresh: now > tokenExpiry.nextRefresh,
          };
        }
        
        // Fallback to localStorage
        try {
          const stored = localStorage.getItem('token_expiry');
          if (!stored) return null;
          
          const expiry = JSON.parse(stored);
          set({ tokenExpiry: expiry });
          
          const now = Date.now();
          return {
            isValid: now < expiry.lastRefresh + expiry.expiresIn,
            timeUntilExpiry: Math.max(0, expiry.lastRefresh + expiry.expiresIn - now),
            shouldRefresh: now > expiry.nextRefresh,
          };
        } catch {
          return null;
        }
      },

      // Auth operations
      initialize: async () => {
        if (typeof window === "undefined") return;

        try {
          if (process.env.NODE_ENV === "development") {
            console.log("🔧 AuthStore: Initializing auth state...");
          }

          const sessionData = await get().checkSession();

          if (sessionData.hasRefreshToken) {
            if (process.env.NODE_ENV === "development") {
              console.log("🔄 AuthStore: Refresh token found");
            }

            // Check if token needs refresh
            const expiryInfo = get().getTokenExpiryInfo();
            
            if (expiryInfo?.shouldRefresh) {
              await get().refreshAccessToken();
            } else if (sessionData.hasAccessToken) {
              // If we have valid access token, fetch user data
              await get().fetchMe();
            }
          } else {
            if (process.env.NODE_ENV === "development") {
              console.log("🔐 AuthStore: No valid session found");
            }
            get().clearTokenExpiry();
          }
        } catch (error) {
          console.error("AuthStore: Initialization error:", error);
          get().clearTokenExpiry();
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
          
          if (response.data.tokenInfo) {
            get().updateTokenExpiry(response.data.tokenInfo);
          }
          
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

          await warmupService.ensureWarm();

          const response = await axiosInstance.post("/login", {
            email,
            password,
          });

          if (response.data.success && response.data.user) {
            if (response.data.tokenInfo) {
              get().updateTokenExpiry(response.data.tokenInfo);
            }
            
            set({
              isLoading: false,
              user: response.data.user,
              error: null,
            });
            return true;
          } else {
            const errorMessage = response.data.error || "Login failed";
            throw new Error(errorMessage);
          }
        } catch (error: any) {
          const errorMessage = axios.isAxiosError(error)
            ? error.response?.data?.error || error.message || "Login failed"
            : error.message || "Login failed";

          console.error("❌ AuthStore: Login failed:", errorMessage);
          set({ isLoading: false, error: errorMessage });
          get().clearTokenExpiry();
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
          get().reset();
        }
      },

      refreshAccessToken: async () => {
        // Prevent multiple simultaneous refresh calls
        if (isRefreshing && refreshPromise) {
          return refreshPromise;
        }

        isRefreshing = true;
        refreshPromise = (async () => {
          try {
            if (process.env.NODE_ENV === "development") {
              console.log("🔄 AuthStore: Refreshing access token...");
            }

            const res = await axiosInstance.post("/refresh-token");

            if (res.data.success && res.data.tokenInfo) {
              const expiryData: TokenExpiryInfo = {
                lastRefresh: Date.now(),
                expiresIn: res.data.tokenInfo.accessTokenExpiresIn * 1000,
                nextRefresh: Date.now() + (res.data.tokenInfo.accessTokenExpiresIn * 1000 * 0.8),
              };
              
              localStorage.setItem("token_expiry", JSON.stringify(expiryData));
              set({ tokenExpiry: expiryData, error: null });

              if (res.data.user) {
                set({ user: res.data.user });
              }
              
              if (process.env.NODE_ENV === "development") {
                console.log("✅ AuthStore: Token refresh successful");
              }
              return true;
            }
            
            return false;
          } catch (error: any) {
            const errorMessage = axios.isAxiosError(error)
              ? error.response?.data?.error || "Token refresh failed"
              : "Token refresh failed";
            
            console.error("❌ AuthStore: Token refresh failed:", errorMessage);
            
            get().clearTokenExpiry();
            set({ error: errorMessage });
            
            if (error.response?.status === 401) {
              setTimeout(() => get().logout(), 100);
            }
            return false;
          } finally {
            isRefreshing = false;
            refreshPromise = null;
          }
        })();

        return refreshPromise;
      },

      fetchMe: async () => {
        try {
          const res = await axiosInstance.get("/me");

          if (res.data.user) {
            set({ user: res.data.user, error: null });
            return res.data.user;
          }
          return null;
        } catch (error: any) {
          if (error.response?.status === 401) {
            // Token might be expired, but don't logout - let interceptor handle it
          }
          console.error("AuthStore: fetchMe failed:", error);
          return null;
        }
      },

      checkSession: async (): Promise<Session> => {
        try {
          const res = await axiosInstance.get("/check-session");

          if (process.env.NODE_ENV === "development") {
            console.log("🔍 AuthStore: Session check result:", res.data);
          }

          return {
            success: res.data.success ?? true,
            hasRefreshToken: res.data.hasRefreshToken ?? false,
            hasAccessToken: res.data.hasAccessToken ?? false,
            cookiesPresent: res.data.cookiesPresent ?? [],
            ...res.data,
          };
        } catch (error) {
          console.error("AuthStore: Session check failed:", error);
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
        tokenExpiry: state.tokenExpiry,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Sync localStorage with Zustand state on rehydration
          const stored = localStorage.getItem('token_expiry');
          if (stored) {
            try {
              state.tokenExpiry = JSON.parse(stored);
            } catch {
              state.tokenExpiry = null;
            }
          }
        }
      },
    }
  )
);

// Axios interceptor remains the same...

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
