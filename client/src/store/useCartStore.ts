import { API_ROUTES } from "@/utils/api";
import axios from "axios";
import debounce from "lodash/debounce";
import { create } from "zustand";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  color: string;
  size: string;
  quantity: number;
  category?: string;
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (item: Omit<CartItem, "id">) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateCartItemQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartStore>((set, get) => {
  const debounceUpdateCartItemQuantity = debounce(
    async (id: string, quantity: number) => {
      try {
        await axios.put(
          `${API_ROUTES.CART}/update/${id}`,
          { quantity },
          {
            withCredentials: true,
          }
        );
      } catch (e: any) {
        console.error("❌ Failed to update cart quantity:", e);
        set({ error: "Failed to update cart quantity" });
      }
    },
    500 // 500ms debounce
  );

  return {
    items: [],
    isLoading: false,
    error: null,

// Update the fetchCart function:
fetchCart: async () => {
  set({ isLoading: true, error: null });
  try {
        console.log("🛒 [DEBUG] Starting fetchCart...");

        // ✅ Log the exact URL construction
        const baseUrl = API_ROUTES.CART;
        const fullUrl = `${baseUrl}/fetch-cart`;

        console.log("🔗 [DEBUG] URL Breakdown:", {
          baseUrl,
          fullUrl,
          NODE_ENV: process.env.NODE_ENV,
          API_BASE_URL: process.env.NEXT_PUBLIC_API_URL,
        });

        // ✅ Test if the route exists with a simple fetch first
        console.log("🧪 [DEBUG] Testing route existence...");
        try {
          const testResponse = await fetch(fullUrl, {
            method: "GET",
            credentials: "include",
          });
          console.log("🧪 [DEBUG] Route test result:", {
            status: testResponse.status,
            statusText: testResponse.statusText,
            ok: testResponse.ok,
          });
        } catch (testError) {
          console.log("🧪 [DEBUG] Route test failed:", testError);
        }

        // ✅ Now try the actual axios call

    const response = await axios.get(fullUrl, {
      withCredentials: true,
      timeout: 10000,
          // ✅ Add headers for better debugging
      headers: {
        "Content-Type": "application/json",
      },
    });

        const cartItems = response.data.data || response.data.items || [];

    set({
          items: cartItems,
      isLoading: false,
    });
  } catch (error: any) {
        console.error("❌ [DEBUG] fetchCart failed completely:", error);

        const errorDetails = {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          data: error.response?.data,
        };

        console.log("🔍 [DEBUG] Complete error details:", errorDetails);

    set({
          error: `Cart fetch failed: ${error.response?.status} ${error.response?.statusText}`,
      isLoading: false,
      items: [], // Reset to empty array on error
    });
  }
},

    addToCart: async (item) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.post(
          `${API_ROUTES.CART}/add-to-cart`,
          item,
          {
            withCredentials: true,
          }
        );

        set((state) => ({
          items: [...state.items, response.data.data],
          isLoading: false,
        }));
      } catch (error: any) {
        console.error("❌ Add to cart failed:", error);
        set({
          error: error.response?.data?.message || "Failed to add to cart",
          isLoading: false,
        });
      }
    },

    removeFromCart: async (id) => {
      set({ isLoading: true, error: null });
      try {
        await axios.delete(`${API_ROUTES.CART}/remove/${id}`, {
          withCredentials: true,
        });

        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
          isLoading: false,
        }));
      } catch (error: any) {
        console.error("❌ Remove from cart failed:", error);
        set({
          error: error.response?.data?.message || "Failed to delete from cart",
          isLoading: false,
        });
      }
    },

    updateCartItemQuantity: async (id, quantity) => {
      if (quantity < 1) return; // Prevent negative quantities

      set((state) => ({
        items: state.items.map((cartItem) =>
          cartItem.id === id ? { ...cartItem, quantity } : cartItem
        ),
      }));

      debounceUpdateCartItemQuantity(id, quantity);
    },

    clearCart: async () => {
      set({ isLoading: true, error: null });
      try {
        await axios.post(
          `${API_ROUTES.CART}/clear-cart`,
          {},
          {
            withCredentials: true,
          }
        );

        set({ items: [], isLoading: false });
      } catch (error: any) {
        console.error("❌ Clear cart failed:", error);
        set({
          error: error.response?.data?.message || "Failed to clear cart",
          isLoading: false,
        });
      }
    },
  };
});
