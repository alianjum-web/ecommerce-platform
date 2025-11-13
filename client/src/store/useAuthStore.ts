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
  register: (name: string, email: string, password: string) => Promise<string | null>;
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
          const response = await axiosInstance.post("/register", { name, email, password });
          set({ isLoading: false });
          return response.data.userId;
        } catch (error) {
          set({
            isLoading: false,
            error: axios.isAxiosError(error) ? error?.response?.data?.error || "Registration failed" : "Registration failed",
          });
          return null;
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axiosInstance.post("/login", { email, password });

          // if backend returns user, use it; otherwise fetch /me
          if (response?.data?.user) {
            set({ isLoading: false, user: response.data.user });
            return true;
          }

          const user = await get().fetchMe();
          set({ isLoading: false, user });
          return !!user;
        } catch (error) {
          set({
            isLoading: false,
            error: axios.isAxiosError(error) ? error?.response?.data?.error || "Login failed" : "Login failed",
          });
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
            error: axios.isAxiosError(error) ? error?.response?.data?.error || "Logout failed" : "Logout failed",
          });
        }
      },

      refreshAccessToken: async () => {
        try {
          const res = await axiosInstance.post("/refresh");
          // consider backend returning { success: true } or 200
          if (res?.status === 200 && (res?.data?.success ?? true)) {
            // populate the user after refresh
            const user = await get().fetchMe();
            if (user) {
              set({ user });
              return true;
            }
            return false;
          }
          return false;
        } catch (e) {
          console.error("refreshAccessToken error", e);
          return false;
        }
      },

      fetchMe: async () => {
        try {
          const res = await axiosInstance.get("/me");
          if (res?.data?.user) {
            set({ user: res.data.user });
            return res.data.user as User;
          }
          return null;
        } catch (error) {
          // clear user on 401 or other failures
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
