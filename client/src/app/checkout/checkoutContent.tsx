// "use client";

// import { paymentAction } from "@/actions/payment";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Separator } from "@/components/ui/separator";
// import { Skeleton } from "@/components/ui/skeleton";
// import { toast } from "@/hooks/use-toast";
// import { useAddressStore } from "@/store/useAddressStore";
// import { useAuthStore } from "@/store/useAuthStore";
// import { CartItem, useCartStore } from "@/store/useCartStore";
// import { Coupon, useCouponStore } from "@/store/useCouponStore";
// import { useOrderStore } from "@/store/useOrderStore";
// import { useProductStore } from "@/store/useProductStore";
// import { PayPalButtons } from "@paypal/react-paypal-js";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";

// function CheckoutContent() {
//   const { addresses, fetchAddresses } = useAddressStore();
//   const [selectedAddress, setSelectedAddress] = useState("");
//   const [showPaymentFlow, setShowPaymentFlow] = useState(false);
//   const [checkoutEmail, setCheckoutEmail] = useState("");
//   const [cartItemsWithDetails, setCartItemsWithDetails] = useState<
//     (CartItem & { product: any })[]
//   >([]);
//   const [couponCode, setCouponCode] = useState("");
//   const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
//   const [couponAppliedError, setCouponAppliedError] = useState("");
//   const { items, fetchCart, clearCart } = useCartStore();
//   const { getProductById } = useProductStore();
//   const { fetchCoupons, couponList } = useCouponStore();
//   const {
//     createPayPalOrder,
//     capturePayPalOrder,
//     createFinalOrder,
//     isPaymentProcessing,
//   } = useOrderStore();
//   const { user } = useAuthStore();
//   const router = useRouter();

//   useEffect(() => {
//     fetchCoupons();
//     fetchAddresses();
//     fetchCart();
//   }, [fetchAddresses, fetchCart, fetchCoupons]);

//   useEffect(() => {
//     const findDefaultAddress = addresses.find((address) => address.isDefault);

//     if (findDefaultAddress) {
//       setSelectedAddress(findDefaultAddress.id);
//     }
//   }, [addresses]);

//   useEffect(() => {
//     const fetchIndividualProductDetails = async () => {
//       const itemsWithDetails = await Promise.all(
//         items.map(async (item) => {
//           const product = await getProductById(item.productId);
//           return { ...item, product };
//         })
//       );

//       setCartItemsWithDetails(itemsWithDetails);
//     };

//     fetchIndividualProductDetails();
//   }, [items, getProductById]);

//   function handleApplyCoupon() {
//     const getCurrentCoupon = couponList.find((c) => c.code === couponCode);

//     if (!getCurrentCoupon) {
//       setCouponAppliedError("Invalied Coupon code");
//       setAppliedCoupon(null);
//       return;
//     }

//     const now = new Date();

//     if (
//       now < new Date(getCurrentCoupon.startDate) ||
//       now > new Date(getCurrentCoupon.endDate)
//     ) {
//       setCouponAppliedError(
//         "Coupon is not valid in this time or expired coupon"
//       );
//       setAppliedCoupon(null);
//       return;
//     }

//     if (getCurrentCoupon.usageCount >= getCurrentCoupon.usageLimit) {
//       setCouponAppliedError(
//         "Coupon has reached its usage limit! Please try a diff coupon"
//       );
//       setAppliedCoupon(null);
//       return;
//     }

//     setAppliedCoupon(getCurrentCoupon);
//     setCouponAppliedError("");
//   }

//   const handlePrePaymentFlow = async () => {
//     const result = await paymentAction(checkoutEmail);
//     if (!result.success) {
//       toast({
//         title: result.error,
//         variant: "destructive",
//       });

//       return;
//     }

//     setShowPaymentFlow(true);
//   };

//   const handleFinalOrderCreation = async (data: any) => {
//     if (!user) {
//       toast({
//         title: "User not authenticated",
//       });

//       return;
//     }
//     try {
//       const orderData = {
//         userId: user?.id,
//         addressId: selectedAddress,
//         items: cartItemsWithDetails.map((item) => ({
//           productId: item.productId,
//           productName: item.product.name,
//           productCategory: item.product.category,
//           quantity: item.quantity,
//           size: item.size,
//           color: item.color,
//           price: item.product.price,
//         })),
//         couponId: appliedCoupon?.id,
//         total,
//         paymentMethod: "CREDIT_CARD" as const,
//         paymentStatus: "COMPLETED" as const,
//         paymentId: data.id,
//       };

//       const createFinalOrderResponse = await createFinalOrder(orderData);

//       if (createFinalOrderResponse) {
//         await clearCart();
//         router.push("/account");
//       } else {
//         toast({
//           title: "There is some error while processing final order",
//           variant: "destructive",
//         });
//       }
//     } catch (error) {
//       console.error(error);
//       toast({
//         title: "There is some error while processing final order",
//         variant: "destructive",
//       });
//     }
//   };

//   const subTotal = cartItemsWithDetails.reduce(
//     (acc, item) => acc + (item.product?.price || 0) * item.quantity,
//     0
//   );

//   const discountAmount = appliedCoupon
//     ? (subTotal * appliedCoupon.discountPercent) / 100
//     : 0;

//   const total = subTotal - discountAmount;

//   if (isPaymentProcessing) {
//     return (
//       <Skeleton className="w-full h-[600px] rounded-xl">
//         <div className="h-full flex justify-center items-center">
//           <h1 className="text-3xl font-bold">
//             Processing payment...Please wait!
//           </h1>
//         </div>
//       </Skeleton>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-white py-8">
//       <div className="container mx-auto px-4 max-w-7xl">
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           <div className="lg:col-span-2 space-y-6">
//             <Card className="p-6">
//               <h2 className="text-xl font-semibold mb-4">Delivery</h2>
//               <div className="space-y-4">
//                 {addresses.map((address) => (
//                   <div key={address.id} className="flex items-start spce-x-2">
//                     <Checkbox
//                       id={address.id}
//                       checked={selectedAddress === address.id}
//                       onCheckedChange={() => setSelectedAddress(address.id)}
//                     />
//                     <Label htmlFor={address.id} className="flex-grow ml-3">
//                       <div>
//                         <span className="font-medium">{address.name}</span>
//                         {address.isDefault && (
//                           <span className="ml-2 text-sm text-green-600">
//                             (Default)
//                           </span>
//                         )}
//                       </div>
//                       <div className="text-sm text-gray-700">
//                         {address.address}
//                       </div>
//                       <div className="text-sm text-gray-600">
//                         {address.city}, {address.country}, {address.postalCode}
//                       </div>
//                       <div className="text-sm text-gray-600">
//                         {address.phone}
//                       </div>
//                     </Label>
//                   </div>
//                 ))}
//                 <Button onClick={() => router.push("/account")}>
//                   Add a new Address
//                 </Button>
//               </div>
//             </Card>
//             <Card className="p-6">
//               {showPaymentFlow ? (
//                 <div>
//                   <h3 className="text-xl font-semibold mb-4">Payment</h3>
//                   <p className="mb-3">
//                     All transactions are secure and encrypted
//                   </p>
//                   <PayPalButtons
//                     style={{
//                       layout: "vertical",
//                       color: "black",
//                       shape: "rect",
//                       label: "pay",
//                     }}
//                     fundingSource="card"
//                     createOrder={async () => {
//                       const orderId = await createPayPalOrder(
//                         cartItemsWithDetails,
//                         total
//                       );

//                       if (orderId === null) {
//                         throw new Error("Failed to create paypal order");
//                       }

//                       return orderId;
//                     }}
//                     onApprove={async (data, actions) => {
//                       const captureData = await capturePayPalOrder(
//                         data.orderID
//                       );

//                       if (captureData) {
//                         await handleFinalOrderCreation(captureData);
//                       } else {
//                         alert("Failed to capture paypal order");
//                       }
//                     }}
//                   />
//                 </div>
//               ) : (
//                 <div>
//                   <h3 className="text-xl font-semibold mb-4">
//                     Enter Email to get started
//                   </h3>
//                   <div className="gap-2 flex items-center">
//                     <Input
//                       type="email"
//                       placeholder="Enter your email"
//                       className="w-full"
//                       value={checkoutEmail}
//                       onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
//                         setCheckoutEmail(event.target.value)
//                       }
//                     />
//                     <Button onClick={handlePrePaymentFlow}>
//                       Proceed to Buy
//                     </Button>
//                   </div>
//                 </div>
//               )}
//             </Card>
//           </div>
//           {/* order summary */}
//           <div className="lg:col-span-1">
//             <Card className="p-6 sticky top-8">
//               <h2>Order summary</h2>
//               <div className="space-y-4">
//                 {cartItemsWithDetails.map((item) => (
//                   <div key={item.id} className="flex items-center space-x-4">
//                     <div className="relative h-2- w-20 rounded-md overflow-hidden">
//                       <img
//                         src={item?.product?.images[0]}
//                         alt={item?.product?.name}
//                         className="object-cover"
//                       />
//                     </div>
//                     <div className="flex-1">
//                       <h3 className="font-medium">{item?.product?.name}</h3>
//                       <p className="text-sm text-gray-600">
//                         {item.color} / {item.size}
//                       </p>
//                       <p className="text-sm text-gray-500">
//                         Qty: {item.quantity}
//                       </p>
//                     </div>
//                     <p className="font-medium">
//                       ${(item?.product?.price * item.quantity).toFixed(2)}
//                     </p>
//                   </div>
//                 ))}
//                 <Separator />
//                 <div className="space-y-2">
//                   <Input
//                     placeholder="Enter a Discount code or Gift code"
//                     onChange={(e) => setCouponCode(e.target.value)}
//                     value={couponCode}
//                   />
//                   <Button
//                     onClick={handleApplyCoupon}
//                     className="w-full"
//                     variant="outline"
//                   >
//                     Apply
//                   </Button>
//                   {couponAppliedError && (
//                     <p className="text-sm text-red-600">{couponAppliedError}</p>
//                   )}
//                   {appliedCoupon && (
//                     <p className="text-sm text-green-600">
//                       Coupon Applied Successfully!
//                     </p>
//                   )}
//                 </div>
//                 <Separator />
//                 <div className="space-y-2">
//                   <div className="flex justify-between">
//                     <span>Subtotal</span>
//                     <span>${subTotal.toFixed(2)}</span>
//                   </div>
//                   {appliedCoupon && (
//                     <div className="flex justify-between text-green-500">
//                       <span>Discount ({appliedCoupon.discountPercent})%</span>
//                       <span>${discountAmount.toFixed(2)}</span>
//                     </div>
//                   )}
//                 </div>
//                 <Separator />

//                 <div className="flex justify-between font-medium">
//                   <span>Total</span>
//                   <span>${total.toFixed(2)}</span>
//                 </div>
//               </div>
//             </Card>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default CheckoutContent;

"use client";

import { paymentAction } from "@/actions/payment";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast, useToast } from "@/hooks/use-toast";
import { useAddressStore } from "@/store/useAddressStore";
import { useAuthStore } from "@/store/useAuthStore";
import { CartItem, useCartStore } from "@/store/useCartStore";
import { Coupon, useCouponStore } from "@/store/useCouponStore";
import { useOrderStore } from "@/store/useOrderStore";
import { useProductStore } from "@/store/useProductStore";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  CreditCard, 
  Package, 
  Truck, 
  Shield, 
  Gift, 
  Mail, 
  MapPin, 
  CheckCircle,
  Lock,
  Zap,
  Sparkles,
  AlertCircle,
  Loader2,
  ArrowRight,
  Percent,
  DollarSign,
  User,
  Phone,
  Globe,
  Home,
  ShoppingBag,
  Clock,
  BadgeCheck,
  Plus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ==================== MODULAR COMPONENTS ====================

// 1. Address Selection Component
interface AddressSelectionProps {
  addresses: any[];
  selectedAddress: string;
  onSelectAddress: (id: string) => void;
  onAddNewAddress: () => void;
}

function AddressSelection({ 
  addresses, 
  selectedAddress, 
  onSelectAddress, 
  onAddNewAddress 
}: AddressSelectionProps) {
  return (
    <Card className="glass-effect border border-glass-border">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Delivery Address</h3>
            <p className="text-sm text-muted-foreground">Select where to deliver your order</p>
          </div>
        </div>

        <div className="space-y-4">
          {addresses.length === 0 ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <p className="text-foreground font-medium mb-2">No addresses saved</p>
              <p className="text-sm text-muted-foreground mb-4">
                Add a delivery address to continue
              </p>
              <Button onClick={onAddNewAddress}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Address
              </Button>
            </div>
          ) : (
            <>
              {addresses.map((address) => (
                <div 
                  key={address.id} 
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                    selectedAddress === address.id 
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                      : 'border-border hover:border-primary/30'
                  }`}
                  onClick={() => onSelectAddress(address.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center mt-1 ${
                      selectedAddress === address.id 
                        ? 'bg-primary' 
                        : 'border-2 border-border'
                    }`}>
                      {selectedAddress === address.id && (
                        <CheckCircle className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{address.name}</span>
                          {address.isDefault && (
                            <Badge className="bg-primary/20 text-primary border-primary/20">
                              <Shield className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>
                        {selectedAddress === address.id && (
                          <Badge className="bg-success/20 text-success border-success/20">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{address.address}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">
                            {address.city}, {address.country} {address.postalCode}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{address.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <Button 
                onClick={onAddNewAddress} 
                variant="outline" 
                className="w-full border-border hover:border-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Use Different Address
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// 2. Payment Flow Component
interface PaymentFlowProps {
  showPaymentFlow: boolean;
  checkoutEmail: string;
  onEmailChange: (email: string) => void;
  onProceedToPayment: () => Promise<void>;
  onPayPalSuccess: (data: any) => Promise<void>;
  onCreatePayPalOrder: () => Promise<string | null>;
  isProcessing: boolean;
}

function PaymentFlow({ 
  showPaymentFlow, 
  checkoutEmail, 
  onEmailChange, 
  onProceedToPayment,
  onPayPalSuccess,
  onCreatePayPalOrder,
  isProcessing 
}: PaymentFlowProps) {
  return (
    <Card className="glass-effect border border-glass-border">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Payment Method</h3>
            <p className="text-sm text-muted-foreground">Choose how you'd like to pay</p>
          </div>
        </div>

        {showPaymentFlow ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-success" />
                  <span className="font-medium text-foreground">Secure Payment</span>
                </div>
                <Badge className="bg-success/20 text-success border-success/20">
                  <Shield className="h-3 w-3 mr-1" />
                  256-bit SSL
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                All transactions are encrypted and secure. Your payment information is never stored.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                PayPal Checkout
              </h4>
              
              <PayPalButtons
                style={{
                  layout: "vertical",
                  color: "black",
                  shape: "rect",
                  label: "paypal",
                  height: 48,
                }}
                fundingSource="card"
                createOrder={async () => {
                  const orderId = await onCreatePayPalOrder();
                  if (!orderId) {
                    throw new Error("Failed to create PayPal order");
                  }
                  return orderId;
                }}
                onApprove={async (data, actions) => {
                  await onPayPalSuccess(data);
                }}
                onError={(err) => {
                  console.error("PayPal Error:", err);
                  toast({
                    title: "Payment Error",
                    description: "There was an issue processing your payment. Please try again.",
                    variant: "destructive",
                  });
                }}
              />

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  By completing your purchase you agree to our Terms of Service
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label htmlFor="checkout-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="checkout-email"
                  type="email"
                  placeholder="Enter your email to continue"
                  value={checkoutEmail}
                  onChange={(e) => onEmailChange(e.target.value)}
                  className="pl-10 bg-input border-border"
                  required
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                We'll send your order confirmation and updates to this email
              </p>
            </div>

            <Button
              onClick={onProceedToPayment}
              disabled={!checkoutEmail || isProcessing}
              className="w-full py-6 text-lg font-semibold"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Verifying...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Lock className="h-5 w-5" />
                  Proceed to Secure Payment
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </Button>

            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Secure
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-1">
                <BadgeCheck className="h-3 w-3" />
                Guaranteed
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                24/7 Support
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 3. Order Summary Component
interface OrderSummaryProps {
  cartItems: any[];
  subtotal: number;
  discountAmount: number;
  total: number;
  couponCode: string;
  appliedCoupon: Coupon | null;
  couponError: string;
  onCouponChange: (code: string) => void;
  onApplyCoupon: () => void;
}

function OrderSummary({ 
  cartItems, 
  subtotal, 
  discountAmount, 
  total, 
  couponCode, 
  appliedCoupon, 
  couponError,
  onCouponChange,
  onApplyCoupon 
}: OrderSummaryProps) {
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;

  return (
    <Card className="glass-effect border border-glass-border sticky top-8">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Order Summary</h3>
            <p className="text-sm text-muted-foreground">{itemCount} items in order</p>
          </div>
        </div>

        {/* Order Items */}
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg bg-card">
              <div className="relative">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
                  <img
                    src={item.product?.images?.[0] || '/placeholder.jpg'}
                    alt={item.product?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {item.quantity > 1 && (
                  <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground">
                    x{item.quantity}
                  </Badge>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate">
                  {item.product?.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  {item.color && (
                    <Badge variant="outline" className="text-xs border-border">
                      {item.color}
                    </Badge>
                  )}
                  {item.size && (
                    <Badge variant="outline" className="text-xs border-border">
                      Size: {item.size}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Qty: {item.quantity}
                </p>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-primary">
                  ${(item.product?.price * item.quantity).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  ${item.product?.price?.toFixed(2)} each
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Coupon Section */}
        <div className="mb-6">
          <Label className="flex items-center gap-2 mb-3">
            <Gift className="h-4 w-4" />
            Discount Code
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => onCouponChange(e.target.value)}
              className="bg-input border-border"
            />
            <Button 
              onClick={onApplyCoupon} 
              variant="outline" 
              className="border-border hover:border-primary"
            >
              Apply
            </Button>
          </div>
          
          {couponError && (
            <div className="mt-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{couponError}</p>
            </div>
          )}
          
          {appliedCoupon && (
            <div className="mt-2 p-2 rounded-lg bg-success/10 border border-success/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <div>
                  <p className="text-sm font-medium text-success">
                    {appliedCoupon.code} Applied
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {appliedCoupon.discountPercent}% discount
                  </p>
                </div>
              </div>
              <Badge className="bg-success/20 text-success border-success/20">
                -${discountAmount.toFixed(2)}
              </Badge>
            </div>
          )}
        </div>

        {/* Order Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          
          {appliedCoupon && (
            <div className="flex items-center justify-between text-success">
              <span className="flex items-center gap-1">
                <Percent className="h-4 w-4" />
                Discount ({appliedCoupon.discountPercent}%)
              </span>
              <span className="font-medium">-${discountAmount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium">
              {shipping === 0 ? (
                <span className="text-success">FREE</span>
              ) : (
                `$${shipping.toFixed(2)}`
              )}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Estimated Tax</span>
            <span className="font-medium">${tax.toFixed(2)}</span>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between text-lg font-bold">
            <span className="text-foreground">Total</span>
            <span className="text-2xl text-primary">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Secure Checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-secondary" />
              <span className="text-xs text-muted-foreground">Free Returns</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Fast Shipping</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">Quality Guaranteed</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 4. Checkout Progress Component
function CheckoutProgress({ currentStep }: { currentStep: number }) {
  const steps = [
    { label: "Cart", icon: ShoppingBag },
    { label: "Delivery", icon: MapPin },
    { label: "Payment", icon: CreditCard },
    { label: "Confirm", icon: CheckCircle },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-card -translate-y-1/2 -z-10">
          <div 
            className="h-full bg-gradient-to-r from-primary via-secondary to-accent transition-all duration-500"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
        </div>
        
        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const StepIcon = step.icon;
          
          return (
            <div key={step.label} className="flex flex-col items-center">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                isCompleted 
                  ? 'bg-gradient-to-r from-primary to-secondary' 
                  : isCurrent 
                  ? 'bg-primary ring-4 ring-primary/20' 
                  : 'bg-card border-2 border-border'
              }`}>
                <StepIcon className={`h-5 w-5 ${
                  isCompleted || isCurrent ? 'text-white' : 'text-muted-foreground'
                }`} />
              </div>
              <span className={`mt-2 text-sm font-medium ${
                isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {step.label}
              </span>
              {isCurrent && (
                <div className="mt-1">
                  <div className="h-1 w-8 rounded-full bg-gradient-to-r from-primary to-secondary animate-pulse" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

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