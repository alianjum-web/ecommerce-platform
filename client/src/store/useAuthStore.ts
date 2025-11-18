// store/useAuthStore.ts - UPDATED WITH DEV PERSISTENCE FIX
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
  initialize: () => Promise<void>;
  // NEW: Manual redirect trigger for development
  triggerRedirect: () => void;
};

const getBaseURL = () => '/api/auth';

console.log("🔧 Environment:", process.env.NODE_ENV);

// Create axios instance
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

      clearError: () => set({ error: null }),

      // NEW: Manual redirect for development debugging
      triggerRedirect: () => {
        const user = get().user;
        if (user) {
          console.log("🔧 MANUAL REDIRECT TRIGGERED for user:", user);
          // This will help us test if redirect works when we force it
          return user;
        }
        return null;
      },

      initialize: async () => {
        if (typeof window === 'undefined') return;
        try {
          console.log("🔧 Initializing auth state...");
          const user = await get().fetchMe();
          if (user) {
            console.log("🔧 User found on initialization:", user);
            set({ user });
          }
        } catch (error) {
          console.log("🔧 No authenticated user found");
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
          
          const response = await axiosInstance.post("/login", { email, password });
          console.log("✅ Login API response:", response.data);

          if (response.data.success && response.data.user) {
            console.log("🎯 Login SUCCESS - User data:", response.data.user);
            
            // CRITICAL FIX: Use functional update and ensure persistence
            set((state) => ({
              ...state,
              isLoading: false,
              user: response.data.user,
              error: null
            }));

            // DEVELOPMENT FIX: Force immediate persistence and verification
            if (process.env.NODE_ENV === 'development') {
              // Wait for state to update
              setTimeout(() => {
                const currentState = get();
                console.log("🔍 DEVELOPMENT - State after login:", currentState);
                console.log("🔍 DEVELOPMENT - User in state:", currentState.user);
                
                // Force save to localStorage
                const storage = localStorage.getItem('auth-storage');
                console.log("🔍 DEVELOPMENT - Storage after login:", storage);
              }, 50);
            }

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
          console.error("Logout error:", error);
        } finally {
          set({ user: null, isLoading: false, error: null });
        }
      },

      refreshAccessToken: async () => {
        try {
          const res = await axiosInstance.post("/refresh-token");
          return res.data.success;
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
      partialize: (state) => ({ 
        user: state.user 
      }),
      // DEVELOPMENT CRITICAL: Better persistence config
      onRehydrateStorage: () => (state) => {
        console.log("🔄 Storage rehydrated:", state?.user);
      }
    }
  )
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshSuccess = await useAuthStore.getState().refreshAccessToken();
        if (refreshSuccess) return axiosInstance(originalRequest);
      } catch {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);