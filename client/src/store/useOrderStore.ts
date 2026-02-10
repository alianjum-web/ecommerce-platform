import { API_ROUTES } from "@/utils/api";
import axios from "axios";
import { create } from "zustand";
import { OrderStore } from "@/types/order/orderTypes";
import { http } from "@/lib/http";

export const useOrderStore = create<OrderStore>((set, get) => ({
  currentOrder: null,
  isLoading: true,
  error: null,
  isPaymentProcessing: false,
  userOrders: [],
  adminOrders: [],

  createOrder: async (orderData) => {
    set({ isLoading: true, error: null, isPaymentProcessing: true });
    try {
      const { data } = await http.post(
        `order/create-order`, 
        orderData,
        { withCredentials: true }
      );

      set({
        isLoading: false,
        isPaymentProcessing: false,
        currentOrder: data.data,
      });

      return data;
    } catch (error: any) {
      set({
        isLoading: false,
        isPaymentProcessing: false,
        error: error.response?.data?.message || "Failed to create order",
      });
      throw error;
    }
  },

  captureOrder: async (captureData) => {
    set({ isLoading: true, error: null, isPaymentProcessing: true });
    try {
      const { data } = await http.post(
        `order/capture-order`, // CHANGED: Unified endpoint
        captureData,
        { withCredentials: true }
      );

      set({
        isLoading: false,
        isPaymentProcessing: false,
        currentOrder: data.data.order,
      });

      return data;
    } catch (error: any) {
      set({
        isLoading: false,
        isPaymentProcessing: false,
        error: error.response?.data?.message || "Failed to capture payment",
      });
      throw error;
    }
  },

  updateOrderStatus: async (orderId, status) => {
    set({ isLoading: true, error: null });
    try {
      await axios.put(
        `order/${orderId}/status`,
        { status },
        { withCredentials: true }
      );
      set((state) => ({
        currentOrder:
          state.currentOrder && state.currentOrder.id === orderId
            ? {
                ...state.currentOrder,
                status,
              }
            : state.currentOrder,
        isLoading: false,
        adminOrders: state.adminOrders.map((item) =>
          item.id === orderId
            ? {
                ...item,
                status,
              }
            : item
        ),
      }));
      return true;
    } catch (err: any) {
      const message =
        err.response.data.message ??
        "Failed to update the order status of product";
      set({ error: message, isLoading: false });
      return false;
    }
  },

  getAllOrdersForAdmin: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(
        `order/get-all-orders-for-admin`,
        { withCredentials: true }
      );
      set({ isLoading: false, adminOrders: response.data });
      return response.data;
    } catch (error) {
      set({ error: "Failed to fetch all orders for admin", isLoading: false });
      return null;
    }
  },
  
  setCurrentOrder: (order) => set({ currentOrder: order }),

  // (for both admin and user same -- output data depends on role of them )
  getAllOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(
        `order/get-all-orders`,
        { withCredentials: true }
      );
      set({ isLoading: false, userOrders: response.data });
      return response.data;
    } catch (error) {
      set({ error: "Failed to fetch all orders", isLoading: false });
      return null;
    }
  },

  getOrderForUser: async (orderId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(
        `order/${orderId}`,
        { withCredentials: true }
      );
      set({ isLoading: false, currentOrder: response.data });
      return response.data;
    } catch (error) {
      set({ error: "Failed to fetch all orders for admin", isLoading: false });
      return null;
    }
  },

  getOrderForAdmin: async (orderId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(
        `order/admin/${orderId}`,
        { withCredentials: true }
      );
      set({ isLoading: false, currentOrder: response.data });
      return response.data;
    } catch (error) {
      set({ error: "Failed to fetch order", isLoading: false });
      return null;
    }
  },
}));
