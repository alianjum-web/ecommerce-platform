// store/useAuthStore.ts
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
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<string | null>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  fetchMe: () => Promise<User | null>;
};

const axiosInstance = axios.create({
  baseURL: "/api/auth", // same-origin proxy
  withCredentials: true,
});

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

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
        } catch (error) {
          set({
            isLoading: false,
            error: axios.isAxiosError(error)
              ? error?.response?.data?.error || "Registration failed"
              : "Registration failed",
          });
          return null;
        }
      },

      // store/useAuthStore.ts - Updated login function
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          console.log("🔄 Login attempt started");
          console.log("📧 Email:", email);
          console.log("🌐 Base URL:", axiosInstance.defaults.baseURL);

          const response = await axiosInstance.post("/login", {
            email,
            password,
          });

          console.log("✅ Login response status:", response.status);
          console.log("📦 Login response data:", response.data);

          if (response.data.success && response.data.user) {
            set({ isLoading: false, user: response.data.user, error: null });
            return true;
          } else {
            const errorMsg = response.data.error || "Login failed";
            console.log("❌ Login failed:", errorMsg);
            set({
              isLoading: false,
              error: errorMsg,
            });
            return false;
          }
        } catch (error: any) {
          console.error("❌ Login error:", error);
          console.log("🔍 Error details:", {
            message: error?.message,
            code: error.code,
            response: error.response?.data,
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
          set({ user: null, isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: axios.isAxiosError(error)
              ? error?.response?.data?.error || "Logout failed"
              : "Logout failed",
          });
        }
      },
      refreshAccessToken: async () => {
        try {
          const res = await axiosInstance.post("/refresh-token"); // ← Fix this
          if (res?.status === 200 && (res?.data?.success ?? true)) {
            const user = await get().fetchMe();
            if (user) {
              set({ user });
              return true;
            }
            return false;
          }
          return false;
        } catch (e) {
          console.error("Refresh token failed:", e);
          // Clear user on refresh failure
          set({ user: null });
          return false;
        }
      },
      fetchMe: async () => {
        try {
          const res = await axiosInstance.get("/me");
          if (res?.data?.user) {
            set({ user: res.data.user, error: null });
            return res.data.user;
          }
          return null;
        } catch (error) {
          console.error("Fetch me failed:", error);
          set({ user: null });
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
