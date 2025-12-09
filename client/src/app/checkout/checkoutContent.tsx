"use client";

import { paymentAction } from "@/actions/payment";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { OrderSummary } from "@/components/user/checkout/OrderSummary";
import { AddressSelection } from "@/components/user/checkout/AddressSkeleton";
import { PaymentFlow } from "@/components/user/checkout/PaymentFlow";
import { CheckoutProgress } from "@/components/user/checkout/CheckOutProgress";
import { useAddressStore } from "@/store/useAddressStore";
import { useAuthStore } from "@/store/useAuthStore";
import { CartItem, useCartStore } from "@/store/useCartStore";
import { useCouponStore } from "@/store/useCouponStore";
import type { Coupon } from "@/types/checkout/Coupon";
import { useOrderStore } from "@/store/useOrderStore";
import { useProductStore } from "@/store/useProductStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Zap, Sparkles, Phone, Shield } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Define types
interface PaymentOrderResponse {
  success: boolean;
  data: {
    internalOrderId: string;
    paymentId: string;
    providerOrderId: string;
    status: string;
    paymentMethod: string;
    approvalUrl?: string; // For PayPal
    url?: string; // For Stripe
    clientSecret?: string; // For Cards
  };
}

function CheckoutContent() {
  const { addresses, fetchAddresses } = useAddressStore();
  const [selectedAddress, setSelectedAddress] = useState("");
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [cartItemsWithDetails, setCartItemsWithDetails] = useState<
    (CartItem & { product: any })[]
  >([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponAppliedError, setCouponAppliedError] = useState("");
  const { items, fetchCart, clearCart } = useCartStore();
  const { getProductById } = useProductStore();
  const { fetchCoupons, couponList } = useCouponStore();
  const { createOrder, captureOrder, isPaymentProcessing } = useOrderStore(); // CHANGED: Remove old methods
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchCoupons();
    fetchAddresses();
    fetchCart();
  }, [fetchAddresses, fetchCart, fetchCoupons]);

  useEffect(() => {
    const findDefaultAddress = addresses.find((address) => address.isDefault);
    if (findDefaultAddress) {
      setSelectedAddress(findDefaultAddress.id);
    }
  }, [addresses]);

  useEffect(() => {
    const fetchIndividualProductDetails = async () => {
      const itemsWithDetails = await Promise.all(
        items.map(async (item) => {
          const product = await getProductById(item.productId);
          return { ...item, product };
        })
      );
      setCartItemsWithDetails(itemsWithDetails);
    };
    fetchIndividualProductDetails();
  }, [items, getProductById]);

  const handleApplyCoupon = () => {
    const getCurrentCoupon = couponList.find((c) => c.code === couponCode);

    if (!getCurrentCoupon) {
      setCouponAppliedError("Invalid coupon code");
      setAppliedCoupon(null);
      return;
    }

    const now = new Date();
    if (
      now < new Date(getCurrentCoupon.startDate) ||
      now > new Date(getCurrentCoupon.endDate)
    ) {
      setCouponAppliedError("Coupon is not valid or has expired");
      setAppliedCoupon(null);
      return;
    }

    if (getCurrentCoupon.usageCount >= getCurrentCoupon.usageLimit) {
      setCouponAppliedError("Coupon has reached its usage limit");
      setAppliedCoupon(null);
      return;
    }

    setAppliedCoupon(getCurrentCoupon);
    setCouponAppliedError("");
  };

  // NEW: Email verification step
  const handlePrePaymentFlow = async () => {
    if (!selectedAddress) {
      toast({
        title: "Address Required",
        description: "Please select a shipping address",
        variant: "destructive",
      });
      return;
    }

    if (!checkoutEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email for verification",
        variant: "destructive",
      });
      return;
    }

    // Optional: Email verification (you can remove if not needed)
    const result = await paymentAction(checkoutEmail);
    if (!result.success) {
      toast({
        title: "Verification Failed",
        description: result.error,
        variant: "destructive",
      });
      return;
    }
    
    setShowPaymentFlow(true);
  };

  // NEW: Main payment handler
  const handlePayment = async (paymentMethod: "PAYPAL" | "STRIPE" | "CARD") => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to complete your purchase",
        variant: "destructive",
      });
      return;
    }

    if (!selectedAddress) {
      toast({
        title: "Address Required",
        description: "Please select a shipping address",
        variant: "destructive",
      });
      return;
    }

    try {
      // Step 1: Create payment order (UNIFIED endpoint)
      const orderData = {
        items: cartItemsWithDetails.map((item) => ({
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

      // CHANGED: Call the unified createOrder endpoint
      const paymentResponse = await createOrder(orderData);

      if (!paymentResponse?.success) {
        throw new Error("Failed to create payment order");
      }

      const paymentData = paymentResponse.data;

      // Step 2: Handle based on payment method
      if (paymentData.approvalUrl && paymentMethod === "PAYPAL") {
        // PayPal: Redirect to approval URL
        window.location.href = paymentData.approvalUrl;
        
        // Store order ID in localStorage for when user returns
        localStorage.setItem("pendingOrder", JSON.stringify({
          internalOrderId: paymentData.internalOrderId,
          paymentId: paymentData.paymentId,
          paymentMethod,
        }));
        
      } else if (paymentData.url && paymentMethod === "STRIPE") {
        // Stripe: Redirect to checkout URL
        window.location.href = paymentData.url;
        
        localStorage.setItem("pendingOrder", JSON.stringify({
          internalOrderId: paymentData.internalOrderId,
          paymentId: paymentData.paymentId,
          paymentMethod,
        }));
        
      } else if (paymentData.clientSecret && paymentMethod === "CARD") {
        // Card: Show card form (you'll need to implement this)
        // For now, we'll simulate capture
        handleCardPayment(paymentData.internalOrderId, paymentData.paymentId);
      } else {
        throw new Error("Invalid payment response");
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    }
  };

  // NEW: Handle card payment (if implementing card payments)
  const handleCardPayment = async (internalOrderId: string, paymentId: string) => {
    try {
      // For card payments, you would collect card details first
      // Then call captureOrder with card data
      const captureData = {
        paymentId,
        paymentMethod: "CARD",
        internalOrderId,
        // cardData: { cardNumber, expiry, cvv, etc. }
      };

      const captureResponse = await captureOrder(captureData);

      if (captureResponse?.success) {
        await clearCart();
        toast({
          title: "Payment Successful!",
          description: "Your order has been placed successfully",
          className: "bg-success/10 border-success/20 text-success",
        });
        router.push(`/account/orders/${captureResponse.data.order?.id}`);
      } else {
        throw new Error("Payment capture failed");
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process card payment",
        variant: "destructive",
      });
    }
  };

  // NEW: Handle return from PayPal/Stripe
  useEffect(() => {
    const handlePaymentReturn = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentId = urlParams.get("paymentId") || urlParams.get("token") || urlParams.get("session_id");
      
      if (!paymentId) return;

      const pendingOrder = localStorage.getItem("pendingOrder");
      if (!pendingOrder) return;

      const { internalOrderId, paymentMethod } = JSON.parse(pendingOrder);

      try {
        const captureData = {
          paymentId,
          paymentMethod,
          internalOrderId,
        };

        const captureResponse = await captureOrder(captureData);

        if (captureResponse?.success) {
          await clearCart();
          localStorage.removeItem("pendingOrder");
          
          toast({
            title: "Payment Successful!",
            description: "Your order has been placed successfully",
            className: "bg-success/10 border-success/20 text-success",
          });
          
          // Clean URL
          window.history.replaceState({}, document.title, "/checkout");
          
          // Redirect to order confirmation
          router.push(`/account/orders/${captureResponse.data.order?.id}`);
        } else {
          throw new Error("Payment capture failed");
        }
      } catch (error: any) {
        toast({
          title: "Payment Failed",
          description: error.message || "Failed to complete payment",
          variant: "destructive",
        });
      }
    };

    // Check if we're returning from payment provider
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("paymentId") || urlParams.get("token") || urlParams.get("session_id")) {
      handlePaymentReturn();
    }
  }, [router, captureOrder, clearCart, toast]);

  const subtotal = cartItemsWithDetails.reduce(
    (acc, item) => acc + (item.product?.price || 0) * item.quantity,
    0
  );

  const discountAmount = appliedCoupon
    ? (subtotal * appliedCoupon.discountPercent) / 100
    : 0;

  const total = subtotal - discountAmount;
  const currentStep = showPaymentFlow ? 2 : selectedAddress ? 1 : 0;

  if (isPaymentProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-card/20 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="h-12 w-12 text-primary animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              Processing Payment
            </h2>
            <p className="text-muted-foreground">
              Please wait while we secure your transaction
            </p>
          </div>
          <Progress value={75} className="w-64 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card/20 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Checkout Progress */}
        <CheckoutProgress currentStep={currentStep} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Delivery & Payment */}
          <div className="lg:col-span-2 space-y-6">
            <AddressSelection
              addresses={addresses}
              selectedAddress={selectedAddress}
              onSelectAddress={setSelectedAddress}
              onAddNewAddress={() => router.push("/account?tab=addresses")}
            />

            {/* Payment Flow Component - UPDATED */}
            {!showPaymentFlow ? (
              <Card className="glass-effect border border-glass-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Email Verification
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Enter your email to receive order confirmation
                  </p>
                  <div className="space-y-4">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={checkoutEmail}
                      onChange={(e) => setCheckoutEmail(e.target.value)}
                      className="w-full p-3 border border-border rounded-lg"
                    />
                    <Button
                      onClick={handlePrePaymentFlow}
                      className="w-full"
                      disabled={!checkoutEmail || !selectedAddress}
                    >
                      Proceed to Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-effect border border-glass-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Select Payment Method
                  </h3>
                  <div className="space-y-3">
                    <Button
                      onClick={() => handlePayment("PAYPAL")}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <img
                        src="/paypal-logo.png"
                        alt="PayPal"
                        className="h-6 w-6 mr-3"
                      />
                      Pay with PayPal
                    </Button>
                    <Button
                      onClick={() => handlePayment("STRIPE")}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <img
                        src="/stripe-logo.png"
                        alt="Stripe"
                        className="h-6 w-6 mr-3"
                      />
                      Pay with Card (Stripe)
                    </Button>
                    <Button
                      onClick={() => handlePayment("CARD")}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      💳 Direct Card Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Note */}
            <Card className="glass-effect border border-glass-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-success" />
                  <div>
                    <h4 className="font-medium text-foreground">
                      100% Secure Checkout
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Your payment information is encrypted and secure. We never
                      store your card details.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <OrderSummary
              cartItems={cartItemsWithDetails}
              subtotal={subtotal}
              discountAmount={discountAmount}
              total={total}
              couponCode={couponCode}
              appliedCoupon={appliedCoupon}
              couponError={couponAppliedError}
              onCouponChange={setCouponCode}
              onApplyCoupon={handleApplyCoupon}
            />

            {/* Need Help */}
            <Card className="mt-4 glass-effect border border-glass-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium text-foreground">Need Help?</h4>
                    <p className="text-sm text-muted-foreground">
                      Contact our support team 24/7
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-3 border-border">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutContent;

