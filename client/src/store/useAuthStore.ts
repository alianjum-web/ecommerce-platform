// store/useAuthStore.ts - ENHANCED VERSION
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

// const getBaseURL = () => {
//   // Use your actual backend URL here
//   return process.env.NODE_ENV === 'development' 
//     ? 'http://localhost:4001/api/auth'
//     : process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL; // Replace with your actual backend URL
// };

const axiosInstance = axios.create({
  baseURL: "/api/auth",
  withCredentials: true,
  timeout: 10000,
});

// Add response interceptor for automatic token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      
      const authStore = useAuthStore.getState();
      
      try {
        const refreshSuccess = await authStore.refreshAccessToken();
        
        if (refreshSuccess) {
          // Retry the original request with new token
          return axiosInstance(error.config);
        }
      } catch (refreshError) {
        console.error("Token refresh in interceptor failed:", refreshError);
        authStore.logout();
      }
    }
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
          set({ user: null, isLoading: false, error: null });
        } catch (error) {
          // Even if logout API fails, clear local state
          set({ user: null, isLoading: false, error: null });
        }
      },

      refreshAccessToken: async () => {
        try {
          console.log("🔄 Attempting token refresh...");
          const res = await axiosInstance.post("/refresh-token");
          
          if (res.data.success) {
            console.log("✅ Token refresh successful");
            // Fetch fresh user data after token refresh
            await get().fetchMe();
            return true;
          }
          return false;
        } catch (e) {
          console.error("❌ Token refresh failed:", e);
          // Don't clear user immediately - let the interceptor handle it
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
          // Don't clear user on fetch failure - might be temporary
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