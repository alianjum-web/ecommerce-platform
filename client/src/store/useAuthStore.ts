// store/useAuthStore.ts - ENHANCED WITH DEV FIXES
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
  initialize: () => Promise<void>; // NEW: Initialize auth state
};

// ✅ DEVELOPMENT FIX: Handle different environments properly
const getBaseURL = () => {
  // In development, we need to be more careful with API routes
  if (process.env.NODE_ENV === 'development') {
    // For client-side in dev, use relative path
    return '/api/auth';
  }
  // For production, always use relative path
  return '/api/auth';
};

console.log("🔧 Environment:", process.env.NODE_ENV);
console.log("🔧 Base URL:", getBaseURL());

// Create axios instance with development-specific config
const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  timeout: 15000, // Increased timeout for dev
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for debugging
axiosInstance.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log("🚀 API Request:", {
        url: config.url,
        method: config.method,
        baseURL: config.baseURL,
        withCredentials: config.withCredentials
      });
    }
    return config;
  },
  (error) => {
    console.error("🚀 API Request Error:", error);
    return Promise.reject(error);
  }
);

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      clearError: () => set({ error: null }),

      // NEW: Initialize auth state on app start
      initialize: async () => {
        // Only run on client side
        if (typeof window === 'undefined') return;
        
        try {
          console.log("🔧 Initializing auth state...");
          const user = await get().fetchMe();
          if (user) {
            console.log("🔧 User found on initialization:", user);
            set({ user });
          }
        } catch (error) {
          console.log("🔧 No authenticated user found on initialization");
        }
      },

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
          console.log("📡 Full URL:", `${axiosInstance.defaults.baseURL}/login`);
          
          const response = await axiosInstance.post("/login", { email, password });
          console.log("✅ Login API response received");

          if (response.data.success && response.data.user) {
            console.log("🎯 Login successful, user:", response.data.user);
            
            // IMPORTANT: Set state and wait for it to complete
            set({ 
              isLoading: false, 
              user: response.data.user, 
              error: null 
            });

            // Development fix: Force state persistence
            if (process.env.NODE_ENV === 'development') {
              setTimeout(() => {
                console.log("🔍 Post-login state verification:", get().user);
              }, 100);
            }

            return true;
          } else {
            const errorMsg = response.data.error || "Login failed";
            console.log("❌ Login failed with message:", errorMsg);
            set({ isLoading: false, error: errorMsg });
            return false;
          }
        } catch (error: any) {
          console.error("💥 Login error:", error);
          
          // Enhanced error logging for development
          if (process.env.NODE_ENV === 'development') {
            console.error("🔍 Development Error Details:", {
              message: error.message,
              code: error.code,
              response: error.response?.data,
              status: error.response?.status,
              url: error.config?.url,
              baseURL: error.config?.baseURL
            });
          }
          
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
          console.log("🚪 Clearing local auth state");
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
          console.log("👤 Fetching user data...");
          const res = await axiosInstance.get("/me");
          console.log("👤 User data response:", res.data);
          
          if (res.data.user) {
            set({ user: res.data.user, error: null });
            return res.data.user;
          }
          return null;
        } catch (error: any) {
          console.error("❌ Fetch me failed:", error.message);
          return null;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }),
      // Development-specific persistence config
      onRehydrateStorage: () => {
        console.log("🔧 Auth store rehydrated");
        return (state, error) => {
          if (error) {
            console.error("❌ Auth store rehydration error:", error);
          } else {
            console.log("✅ Auth store rehydrated successfully");
          }
        };
      }
    }
  )
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log("✅ API Success:", response.config.url, response.status);
    }
    return response;
  },
  async (error) => {
    console.error("❌ API Error:", error.config?.url, error.response?.status);
    
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log("🔄 Attempting auto-refresh for 401 error");
      
      try {
        const refreshSuccess = await useAuthStore.getState().refreshAccessToken();
        
        if (refreshSuccess) {
          console.log("✅ Token refreshed, retrying request");
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        console.error("❌ Token refresh in interceptor failed:", refreshError);
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);