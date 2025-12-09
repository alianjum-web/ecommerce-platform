// hooks/usePayment.ts
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useOrderStore } from "@/store/useOrderStore";
import { useCartStore } from "@/store/useCartStore";

interface UsePaymentProps {
  cartItems: any[];
  selectedAddress: string;
  appliedCoupon: any;
  total: number;
  onSuccess?: () => void;
}

export const usePayment = ({
  cartItems,
  selectedAddress,
  appliedCoupon,
  total,
  onSuccess,
}: UsePaymentProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const { createOrder, captureOrder } = useOrderStore();
  const { clearCart } = useCartStore();
  
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  const handlePayment = useCallback(async (paymentMethod: "PAYPAL" | "STRIPE" | "CARD") => {
    setIsPaymentProcessing(true);
    
    try {
      // Prepare order data
      const orderData = {
        items: cartItems.map((item) => ({
          productId: item.productId,
          productName: item.product?.name || "Product",
          productCategory: item.product?.category || "General",
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: item.product?.price || 0,
        })),
        total,
        paymentMethod,
        addressId: selectedAddress,
        couponId: appliedCoupon?.id,
      };

      // Step 1: Create payment order
      const paymentResponse = await createOrder(orderData);

      if (!paymentResponse?.success) {
        throw new Error("Failed to create payment order");
      }

      const paymentData = paymentResponse.data;

      // Step 2: Handle based on payment method
      if (paymentData.approvalUrl && paymentMethod === "PAYPAL") {
        // PayPal: Redirect to approval URL
        localStorage.setItem("pendingOrder", JSON.stringify({
          internalOrderId: paymentData.internalOrderId,
          paymentId: paymentData.paymentId,
          paymentMethod,
        }));
        window.location.href = paymentData.approvalUrl;
        
      } else if (paymentData.url && paymentMethod === "STRIPE") {
        // Stripe: Redirect to checkout URL
        localStorage.setItem("pendingOrder", JSON.stringify({
          internalOrderId: paymentData.internalOrderId,
          paymentId: paymentData.paymentId,
          paymentMethod,
        }));
        window.location.href = paymentData.url;
        
      } else if (paymentData.clientSecret && paymentMethod === "CARD") {
        // Card: Handle card payment (implement card form)
        // For now, we'll just show a message
        toast({
          title: "Card Payment",
          description: "Direct card payment is not implemented yet",
          variant: "default",
        });
        setIsPaymentProcessing(false);
      } else {
        throw new Error("Invalid payment response");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
      setIsPaymentProcessing(false);
    }
  }, [cartItems, selectedAddress, appliedCoupon, total, createOrder, toast]);

  const handlePaymentReturn = useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get("paymentId") || 
                     urlParams.get("token") || 
                     urlParams.get("session_id");
    
    if (!paymentId) return;

    const pendingOrder = localStorage.getItem("pendingOrder");
    if (!pendingOrder) return;

    setIsPaymentProcessing(true);
    
    try {
      const { internalOrderId, paymentMethod } = JSON.parse(pendingOrder);

      const captureData = {
        paymentId,
        paymentMethod,
        internalOrderId,
      };

      const captureResponse = await captureOrder(captureData);

      if (captureResponse?.success) {
        await clearCart();
        localStorage.removeItem("pendingOrder");
        
        // Clean URL
        window.history.replaceState({}, document.title, "/checkout");
        
        toast({
          title: "Payment Successful!",
          description: "Your order has been placed successfully",
          className: "bg-success/10 border-success/20 text-success",
        });
        
        // Call success callback
        onSuccess?.();
        
        // Redirect to order confirmation
        if (captureResponse.data.order?.id) {
          router.push(`/account/orders/${captureResponse.data.order.id}`);
        }
      } else {
        throw new Error("Payment capture failed");
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to complete payment",
        variant: "destructive",
      });
    } finally {
      setIsPaymentProcessing(false);
    }
  }, [captureOrder, clearCart, router, toast, onSuccess]);

  // Check for payment return on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("paymentId") || urlParams.get("token") || urlParams.get("session_id")) {
      handlePaymentReturn();
    }
  }, [handlePaymentReturn]);

  return {
    handlePayment,
    handlePaymentReturn,
    isPaymentProcessing,
  };
};