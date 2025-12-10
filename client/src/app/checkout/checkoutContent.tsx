"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

import type {
  Address,
  CartItemWithProduct,
  Coupon,
  PaymentOrderRequest,
  CapturePaymentRequest,
} from "@/types/checkout";

// Import your existing interfaces
import type { Product, ProductFilters } from "@/types/product";
import type { CartItem } from "@/store/useCartStore";

// Store hooks (keep as is)
import { useAddressStore } from "@/store/useAddressStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useCouponStore } from "@/store/useCouponStore";
import { useOrderStore } from "@/store/useOrderStore";
import { useProductStore } from "@/store/useProductStore";

// UI components
import { Shield, Phone, AlertCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Modular checkout components
import { CheckoutProgress } from "@/components/user/checkout/CheckOutProgress";
import { AddressSelection } from "@/components/user/checkout/AddressSkeleton";
import { OrderSummary } from "@/components/user/checkout/OrderSummary";
import { PaymentMethods } from "@/components/user/checkout/PaymentMethods";
import { PaymentProcessing } from "@/components/user/checkout/PaymentProcessing";

const convertToCartItemWithProduct = (
  item: CartItem
): CartItemWithProduct => ({
  id: item.id,
  productId: item.productId,
  quantity: item.quantity,
  size: item.size,
  color: item.color,
  product: {
    id: item.productId,
    name: item.name || "Product",
    price: item.price || 0,
    category: item.category || "General",
    images: item.image ? [item.image] : [],
  },
});

export function CheckoutContent() {
  const router = useRouter();
  const { toast } = useToast();

  // Store hooks
  const { addresses, fetchAddresses } = useAddressStore();
  const { items, fetchCart, clearCart } = useCartStore();
  const { getProductById } = useProductStore();
  const { fetchCoupons, couponList } = useCouponStore();
  const { createOrder, captureOrder, isPaymentProcessing } = useOrderStore();
  const { user } = useAuthStore();

  // Local state with proper types
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [cartItemsWithDetails, setCartItemsWithDetails] = useState<
    CartItemWithProduct[]
  >([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Calculate totals using useMemo to avoid recalculations
  const { subtotal, discountAmount, total } = useMemo(() => {
    const sub = cartItemsWithDetails.reduce(
      (sum, item) => sum + (item.product?.price || 0) * item.quantity,
      0
    );

    const discount = appliedCoupon
      ? (sub * appliedCoupon.discountPercent) / 100
      : 0;

    const finalTotal = Math.max(0, sub - discount);

    return {
      subtotal: sub,
      discountAmount: discount,
      total: finalTotal,
    };
  }, [cartItemsWithDetails, appliedCoupon]);

  // Determine if checkout is ready
  const isCheckoutReady = Boolean(
    selectedAddress && cartItemsWithDetails.length > 0
  );

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchAddresses(), fetchCart(), fetchCoupons()]);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load checkout data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [fetchAddresses, fetchCart, fetchCoupons, toast]);

  // Set default address
  useEffect(() => {
    const defaultAddress = addresses.find((addr) => addr.isDefault);
    if (defaultAddress) {
      setSelectedAddress(defaultAddress.id);
    }
  }, [addresses]);

// Fetch product details for cart items - SIMPLIFIED VERSION
useEffect(() => {
  console.log("🔄 Processing cart items:", items);
  
  const processCartItems = () => {
    if (items.length === 0) {
      console.log("No items in cart");
      setCartItemsWithDetails([]);
      return;
    }
    
    // Convert using data already in cart items (name, price, image are in cart items)
    const convertedItems = items.map((item) => {
      console.log("Converting item:", {
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image
      });
      
      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        product: {
          id: item.productId,
          name: item.name || `Product ${item.productId}`, // Use name from cart
          price: item.price || 0, // Use price from cart
          category: item.category || "General",
          images: item.image ? [item.image] : [], // Use image from cart
        },
      } as CartItemWithProduct;
    });
    
    console.log("✅ Converted items:", convertedItems);
    setCartItemsWithDetails(convertedItems);
  };
  
  processCartItems();
}, [items]); // Remove getProductById from dependencies

  // Handle coupon application
  const handleApplyCoupon = useCallback(() => {
    setCouponError("");

    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    const coupon = couponList.find((c) => c.code === couponCode.trim());
    if (!coupon) {
      setCouponError("Invalid coupon code");
      setAppliedCoupon(null);
      return;
    }

    const now = new Date();
    const startDate = new Date(coupon.startDate);
    const endDate = new Date(coupon.endDate);

    if (now < startDate || now > endDate) {
      setCouponError("Coupon is not currently valid");
      setAppliedCoupon(null);
      return;
    }

    if (coupon.usageCount >= coupon.usageLimit) {
      setCouponError("Coupon has reached its usage limit");
      setAppliedCoupon(null);
      return;
    }

    setAppliedCoupon(coupon);
    toast({
      title: "Coupon Applied!",
      description: `You saved ${coupon.discountPercent}%`,
      variant: "default",
    });
  }, [couponCode, couponList, toast]);

  // Handle payment method selection
  const handlePaymentMethodSelect = useCallback(
    async (paymentMethod: "PAYPAL" | "STRIPE" | "CARD") => {
      // Validate user is authenticated
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to complete your purchase",
          variant: "destructive",
        });
        router.push("/login?redirect=/checkout");
        return;
      }

      // Validate address is selected
      if (!selectedAddress) {
        toast({
          title: "Address Required",
          description: "Please select a shipping address",
          variant: "destructive",
        });
        return;
      }

      // Validate cart is not empty
      if (cartItemsWithDetails.length === 0) {
        toast({
          title: "Cart Empty",
          description: "Your cart is empty",
          variant: "destructive",
        });
        router.push("/cart");
        return;
      }

      // Handle specific payment methods
      if (paymentMethod === "CARD") {
        toast({
          title: "Coming Soon",
          description: "Direct card payments will be available soon",
          variant: "default",
        });
        return;
      }

      try {
        // Prepare payment order request
        const orderRequest: PaymentOrderRequest = {
          items: cartItemsWithDetails.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            productCategory: item.product.category,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            price: item.product.price,
          })),
          total, // This is now available because we use useMemo
          paymentMethod,
          addressId: selectedAddress,
          couponId: appliedCoupon?.id,
        };

        // Call createOrder endpoint
        const response = await createOrder(orderRequest);

        if (!response?.success) {
          throw new Error(response?.error || "Failed to create payment order");
        }

        const paymentData = response.data;

        // Store order info for when user returns
        localStorage.setItem(
          "pendingOrder",
          JSON.stringify({
            internalOrderId: paymentData.internalOrderId,
            paymentId: paymentData.paymentId,
            paymentMethod,
            timestamp: Date.now(),
          })
        );

        // Store cart backup in case of failure
        localStorage.setItem("cartBackup", JSON.stringify(items));

        // Redirect based on payment method
        if (paymentMethod === "PAYPAL" && paymentData.approvalUrl) {
          window.location.href = paymentData.approvalUrl;
        } else if (paymentMethod === "STRIPE" && paymentData.url) {
          window.location.href = paymentData.url;
        } else {
          throw new Error("No payment URL provided");
        }
      } catch (error: any) {
        console.error("Payment initiation error:", error);
        toast({
          title: "Payment Failed",
          description: error.message || "Failed to process payment",
          variant: "destructive",
        });
      }
    },
    [
      user,
      cartItemsWithDetails,
      total,
      selectedAddress,
      appliedCoupon,
      items,
      createOrder,
      router,
      toast,
    ]
  );

  // Handle return from payment provider
  useEffect(() => {
    const handlePaymentReturn = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentId =
        urlParams.get("paymentId") ||
        urlParams.get("token") ||
        urlParams.get("session_id");

      if (!paymentId) return;

      const pendingOrder = localStorage.getItem("pendingOrder");
      if (!pendingOrder) return;

      try {
        const { internalOrderId, paymentMethod, timestamp } =
          JSON.parse(pendingOrder);

        // Check if order is too old (30 minutes)
        if (Date.now() - timestamp > 30 * 60 * 1000) {
          throw new Error("Payment session expired. Please try again.");
        }

        const captureRequest: CapturePaymentRequest = {
          paymentId,
          paymentMethod,
          internalOrderId,
        };

        const response = await captureOrder(captureRequest);

        if (response?.success) {
          // Clear cart and local storage
          await clearCart();
          localStorage.removeItem("pendingOrder");
          localStorage.removeItem("cartBackup");

          // Clean URL
          window.history.replaceState({}, document.title, "/checkout/success");

          // Show success
          toast({
            title: "🎉 Order Confirmed!",
            description: "Your order has been placed successfully",
            className: "bg-success/10 border-success/20 text-success",
          });

          // Redirect to success page
          setTimeout(() => {
            router.push(`/checkout/success?orderId=${response.data.order?.id}`);
          }, 1500);
        } else {
          throw new Error(response?.error || "Payment capture failed");
        }
      } catch (error: any) {
        console.error("Payment capture error:", error);

        // Restore cart from backup if available
        const cartBackup = localStorage.getItem("cartBackup");
        if (cartBackup) {
          // You would implement cart restoration here
          console.log("Cart backup available for restoration");
        }

        toast({
          title: "Payment Failed",
          description: error.message || "Failed to complete payment",
          variant: "destructive",
        });

        // Clean up
        localStorage.removeItem("pendingOrder");
        localStorage.removeItem("cartBackup");
      }
    };

    // Check if we have payment parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (
      urlParams.get("paymentId") ||
      urlParams.get("token") ||
      urlParams.get("session_id")
    ) {
      handlePaymentReturn();
    }
  }, [router, captureOrder, clearCart, toast]);

  // Show loading state
  if (isLoading) {
    return <PaymentProcessing message="Loading your checkout..." />;
  }

  // Show empty cart state
  if (cartItemsWithDetails.length === 0) {
      console.log("Debug - Empty cart condition triggered:", {
    cartItemsWithDetails,
    items,
    isLoading
  }); 
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6 max-w-sm">
          <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mx-auto">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Your cart is empty
            </h2>
            <p className="text-muted-foreground">
              Add some items to your cart before checking out
            </p>
          </div>
          <Button onClick={() => router.push("/")}>Continue Shopping</Button>
        </div>
      </div>
    );
  }


  // Add this debug useEffect
useEffect(() => {
  console.log("=== PRODUCT STORE DEBUG ===");
  const productStore = useProductStore.getState();
  console.log("Product store state:", productStore);
  
  // Test getProductById with the first item
  if (items.length > 0) {
    const firstItem = items[0];
    console.log("Testing getProductById with:", firstItem.productId);
    
    // Directly call getProductById
    const product = productStore.getProductById(firstItem.productId);
    console.log("Product found:", product);
    
    // Also check if products array exists
    console.log("All products in store:", productStore.products);
  }
}, [items]);

  // Show payment processing
  if (isPaymentProcessing) {
    return <PaymentProcessing />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card/20 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
            <span className="text-sm text-muted-foreground">
              {cartItemsWithDetails.length} item
              {cartItemsWithDetails.length !== 1 ? "s" : ""}
            </span>
          </div>
          <CheckoutProgress currentStep={selectedAddress ? 1 : 0} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Delivery & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Address Selection */}
            <AddressSelection
              addresses={addresses}
              selectedAddress={selectedAddress}
              onSelectAddress={setSelectedAddress}
              onAddNewAddress={() => router.push("/account?tab=addresses")}
            />

            {/* Payment Methods - Only show if address is selected */}
            {selectedAddress ? (
              <PaymentMethods
                onSelectPaymentMethod={handlePaymentMethodSelect}
                isLoading={isPaymentProcessing}
                isReady={isCheckoutReady}
              />
            ) : (
              <Card className="glass-effect border border-glass-border">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Select Shipping Address
                      </h3>
                      <p className="text-muted-foreground">
                        Please select a shipping address to continue with
                        payment
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Assurance */}
            <Card className="glass-effect border border-glass-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-success" />
                  <div>
                    <h4 className="font-medium text-foreground">
                      Secure Checkout
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Your payment is encrypted and secure. We never store your
                      card details.
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
              couponError={couponError}
              onCouponChange={setCouponCode}
              onApplyCoupon={handleApplyCoupon}
              isCheckoutReady={isCheckoutReady}
            />

            {/* Support Card */}
            <Card className="mt-4 glass-effect border border-glass-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Phone className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Need Help?</h4>
                    <p className="text-sm text-muted-foreground">
                      Contact our support team 24/7
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-3 border-border"
                  onClick={() => router.push("/contact")}
                >
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
