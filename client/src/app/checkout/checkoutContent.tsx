"use client";

import { paymentAction } from "@/actions/payment";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {  useToast } from "@/hooks/use-toast";
import { OrderSummary } from "@/components/user/checkout/OrderSummary";
import { AddressSelection } from "@/components/user/checkout/AddressSkeleton";
import { PaymentFlow } from "@/components/user/checkout/PaymentFlow";
import { CheckoutProgress } from "@/components/user/checkout/CheckOutProgress";
import { useAddressStore } from "@/store/useAddressStore";
import { useAuthStore } from "@/store/useAuthStore";
import { CartItem, useCartStore } from "@/store/useCartStore";
import {  useCouponStore } from "@/store/useCouponStore";
import type { Coupon } from "@/types/checkout/Coupon";
import { useOrderStore } from "@/store/useOrderStore";
import { useProductStore } from "@/store/useProductStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  Zap,
  Sparkles,
  Phone,
  Shield,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

function CheckoutContent() {
  const { addresses, fetchAddresses } = useAddressStore();
  const [selectedAddress, setSelectedAddress] = useState("");
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [cartItemsWithDetails, setCartItemsWithDetails] = useState<(CartItem & { product: any })[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponAppliedError, setCouponAppliedError] = useState("");
  const { items, fetchCart, clearCart } = useCartStore();
  const { getProductById } = useProductStore();
  const { fetchCoupons, couponList } = useCouponStore();
  const {
    createPayPalOrder,
    capturePayPalOrder,
    createFinalOrder,
    isPaymentProcessing,
  } = useOrderStore();
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
    if (now < new Date(getCurrentCoupon.startDate) || now > new Date(getCurrentCoupon.endDate)) {
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

  const handlePrePaymentFlow = async () => {
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

  const handleFinalOrderCreation = async (data: any) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to complete your purchase",
        variant: "destructive",
      });
      return;
    }

    try {
      const orderData = {
        userId: user.id,
        addressId: selectedAddress,
        items: cartItemsWithDetails.map((item) => ({
          productId: item.productId,
          productName: item.product?.name,
          productCategory: item.product?.category,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: item.product?.price,
        })),
        couponId: appliedCoupon?.id,
        total,
        paymentMethod: "CREDIT_CARD" as const,
        paymentStatus: "COMPLETED" as const,
        paymentId: data.id,
      };

      const createFinalOrderResponse = await createFinalOrder(orderData);

      if (createFinalOrderResponse) {
        await clearCart();
        toast({
          title: "Order Confirmed!",
          description: "Your order has been placed successfully",
          className: "bg-success/10 border-success/20 text-success",
        });
        router.push("/account");
      } else {
        throw new Error("Failed to create order");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Order Failed",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive",
      });
    }
  };

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

            <PaymentFlow
              showPaymentFlow={showPaymentFlow}
              checkoutEmail={checkoutEmail}
              onEmailChange={setCheckoutEmail}
              onProceedToPayment={handlePrePaymentFlow}
              onPayPalSuccess={handleFinalOrderCreation}
              onCreatePayPalOrder={() => createPayPalOrder(cartItemsWithDetails, total)}
              isProcessing={false}
            />

            {/* Security Note */}
            <Card className="glass-effect border border-glass-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-success" />
                  <div>
                    <h4 className="font-medium text-foreground">100% Secure Checkout</h4>
                    <p className="text-sm text-muted-foreground">
                      Your payment information is encrypted and secure. We never store your card details.
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