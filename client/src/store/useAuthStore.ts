import { API_ROUTES } from "@/utils/api";
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
  refreshAccessToken: () => Promise<Boolean>;
};

const axiosInstance = axios.create({
  // baseURL: API_ROUTES.AUTH,
  baseURL: "/api/auth",
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
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axiosInstance.post("/login", {
            email,
            password,
          });

          set({ isLoading: false, user: response.data.user });
          return true;
        } catch (error) {
          set({
            isLoading: false,
            error: axios.isAxiosError(error)
              ? error?.response?.data?.error || "Login failed"
              : "Login failed",
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
            error: axios.isAxiosError(error)
              ? error?.response?.data?.error || "Logout failed"
              : "Logout failed",
          });
        }
      },
      // refreshAccessToken: async () => {
      //   try {
      //     await axiosInstance.post("/refresh-token");
      //     return true;
      //   } catch (e) {
      //     console.error(e);
      //     return false;
      //   }
      // },
      refreshAccessToken: async () => {
        try {
          // call proxy refresh endpoint which will forward Set-Cookie headers to the browser
          const res = await axiosInstance.post("/refresh");
          if (res?.data?.success) {
            // optionally fetch current user profile if backend returns it, or call /me
            // const me = await axiosInstance.get("/me");
            // set({ user: me.data.user });
            return true;
          }
          return false;
        } catch (e) {
          console.error(e);
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
          // optional: if server returns different shape
          return null;
        } catch (error) {
          // 401 or other => clear user
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
