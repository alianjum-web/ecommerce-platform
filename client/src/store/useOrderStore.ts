import { API_ROUTES } from "@/utils/api";
import axios from "axios";
import { create } from "zustand";
import { OrderStore } from "@/types/order/orderTypes";

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
      const response = await axios.post(
        `${API_ROUTES.ORDER}/create-order`, // CHANGED: Unified endpoint
        orderData,
        { withCredentials: true }
      );

      set({
        isLoading: false,
        isPaymentProcessing: false,
        currentOrder: response.data.data,
      });

      return response.data;
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
      const response = await axios.post(
        `${API_ROUTES.ORDER}/capture-order`, // CHANGED: Unified endpoint
        captureData,
        { withCredentials: true }
      );

      set({
        isLoading: false,
        isPaymentProcessing: false,
        currentOrder: response.data.data.order,
      });

      return response.data;
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
        `${API_ROUTES.ORDER}/${orderId}/status`,
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
        `${API_ROUTES.ORDER}/get-all-orders-for-admin`,
        { withCredentials: true }
      );
      set({ isLoading: false, adminOrders: response.data });
      return response.data;
    } catch (error) {
      set({ error: "Failed to fetch all orders for admin", isLoading: false });
      return null;
    }
  },

  getOrdersByUserId: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(
        `${API_ROUTES.ORDER}/get-order-by-user-id`,
        { withCredentials: true }
      );
      set({ isLoading: false, userOrders: response.data });
      return response.data;
    } catch (error) {
      set({ error: "Failed to fetch all orders for admin", isLoading: false });
      return null;
    }
  },

  setCurrentOrder: (order) => set({ currentOrder: order }),

  getOrder: async (orderId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(
        `${API_ROUTES.ORDER}/get-single-order/${orderId}`,
        { withCredentials: true }
      );
      set({ isLoading: false, currentOrder: response.data });
      return response.data;
    } catch (error) {
      set({ error: "Failed to fetch all orders for admin", isLoading: false });
      return null;
    }
  },
}));
