// // app/cart/page.tsx
// "use client";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { useAuthStore } from "@/store/useAuthStore";
// import { useCartStore } from "@/store/useCartStore";
// import { Minus, Plus } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";

// // ✅ Add this type guard function
// function getCartItems(items: any): any[] {
//   if (Array.isArray(items)) {
//     return items;
//   }

//   if (items && typeof items === "object" && Array.isArray(items.items)) {
//     return items.items;
//   }

//   if (
//     items &&
//     typeof items === "object" &&
//     items.data &&
//     Array.isArray(items.data.items)
//   ) {
//     return items.data.items;
//   }

//   return [];
// }

// function UserCartPage() {
//   const {
//     fetchCart,
//     items,
//     isLoading,
//     updateCartItemQuantity,
//     removeFromCart,
//   } = useCartStore();
//   const { user } = useAuthStore();
//   const [isUpdating, setIsUpdating] = useState(false);
//   const [isMounted, setIsMounted] = useState(false);
//   const router = useRouter();

//   useEffect(() => {
//     setIsMounted(true);
//     fetchCart();
//   }, [fetchCart]);

//   const handleUpdateQuantity = async (id: string, newQuantity: number) => {
//     if (newQuantity < 1) return;
//     setIsUpdating(true);
//     await updateCartItemQuantity(id, newQuantity);
//     setIsUpdating(false);
//   };

//   const handleRemoveItem = async (id: string) => {
//     setIsUpdating(true);
//     await removeFromCart(id);
//     setIsUpdating(false);
//   };

//   // ✅ FIX: Use the type-safe function
//   const cartItems = getCartItems(items);
//   console.log("My cart items is ", cartItems);
//   const total = cartItems.reduce(
//     (sum, item) => sum + item.price * item.quantity,
//     0
//   );

//   // Prevent hydration mismatch by not rendering until mounted
//   if (!isMounted || isLoading) {
//     return (
//       <div className="min-h-screen bg-white py-8">
//         <div className="container mx-auto px-4">
//           <div className="animate-pulse">
//             <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-8"></div>
//             <div className="space-y-4">
//               {[...Array(3)].map((_, i) => (
//                 <div key={i} className="h-20 bg-gray-200 rounded"></div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!user) {
//     router.push("/auth/login");
//     return null;
//   }

//   return (
//     <div className="min-h-screen bg-white py-8">
//       <div className="container mx-auto px-4">
//         <h1 className="text-3xl font-bold text-center mb-8">YOUR CART</h1>

//         {cartItems.length === 0 ? (
//           <div className="text-center py-16">
//             <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
//             <Button onClick={() => router.push("/listing")}>
//               Continue Shopping
//             </Button>
//           </div>
//         ) : (
//           <>
//             <div className="w-full overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="text-left py-4 px-4">PRODUCT</th>
//                     <th className="text-right py-4 px-4">PRICE</th>
//                     <th className="text-center py-4 px-4">QUANTITY</th>
//                     <th className="text-right py-4 px-4">TOTAL</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {cartItems.map((item) => (
//                     <tr key={item.id} className="border-t">
//                       <td className="py-4 px-4">
//                         <div className="flex items-center gap-4">
//                           <img
//                             src={item.image}
//                             alt={item.name}
//                             className="w-20 h-20 object-cover"
//                           />
//                           <div>
//                             <h3 className="font-medium">{item.name}</h3>
//                             <p className="text-sm text-gray-700">
//                               Color: {item.color}
//                             </p>
//                             <p className="text-sm text-gray-700">
//                               Size: {item.size}
//                             </p>
//                             <Button
//                               disabled={isUpdating}
//                               onClick={() => handleRemoveItem(item.id)}
//                               variant="destructive"
//                               size="sm"
//                               className="mt-2"
//                             >
//                               Remove
//                             </Button>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="py-4 px-4 text-right">
//                         ${item.price.toFixed(2)}
//                       </td>
//                       <td className="py-4 px-4">
//                         <div className="flex items-center justify-center gap-2">
//                           <Button
//                             disabled={isUpdating || item.quantity <= 1}
//                             onClick={() =>
//                               handleUpdateQuantity(item.id, item.quantity - 1)
//                             }
//                             variant="outline"
//                             size="icon"
//                           >
//                             <Minus className="h-4 w-4" />
//                           </Button>
//                           <Input
//                             type="number"
//                             className="w-16 text-center"
//                             value={item.quantity}
//                             onChange={(e) =>
//                               handleUpdateQuantity(
//                                 item.id,
//                                 parseInt(e.target.value) || 1
//                               )
//                             }
//                             min="1"
//                           />
//                           <Button
//                             disabled={isUpdating}
//                             onClick={() =>
//                               handleUpdateQuantity(item.id, item.quantity + 1)
//                             }
//                             variant="outline"
//                             size="icon"
//                           >
//                             <Plus className="h-4 w-4" />
//                           </Button>
//                         </div>
//                       </td>
//                       <td className="py-4 px-4 text-right">
//                         ${(item.price * item.quantity).toFixed(2)}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//             <div className="mt-8 flex justify-end">
//               <div className="space-y-4 w-80">
//                 <div className="flex justify-between items-center text-lg">
//                   <span className="font-medium">TOTAL</span>
//                   <span className="font-bold">${total.toFixed(2)}</span>
//                 </div>
//                 <Button
//                   onClick={() => router.push("/checkout")}
//                   className="w-full bg-black text-white hover:bg-gray-800"
//                 >
//                   PROCEED TO CHECKOUT
//                 </Button>
//                 <Button
//                   onClick={() => router.push("/listing")}
//                   className="w-full"
//                   variant="outline"
//                 >
//                   CONTINUE SHOPPING
//                 </Button>
//               </div>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// export default UserCartPage;

// app/cart/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  ShoppingCart, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Package,
  Truck,
  Shield,
  Gift,
  CreditCard,
  RefreshCw,
  Heart,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ==================== MODULAR COMPONENTS ====================

// 1. Cart Item Component
interface CartItemProps {
  item: any;
  onUpdateQuantity: (id: string, quantity: number) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  isUpdating: boolean;
}

function CartItem({ item, onUpdateQuantity, onRemove, isUpdating }: CartItemProps) {
  return (
    <Card className="glass-effect border border-glass-border hover:border-primary/30 transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Product Image */}
          <div className="relative">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            {item.quantity > 1 && (
              <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground">
                x{item.quantity}
              </Badge>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2">
                <h3 className="font-bold text-foreground text-lg line-clamp-1">
                  {item.name}
                </h3>
                
                <div className="flex items-center gap-4 text-sm">
                  {item.color && (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border border-border" 
                           style={{ backgroundColor: item.color.toLowerCase() }} />
                      <span className="text-muted-foreground">{item.color}</span>
                    </div>
                  )}
                  
                  {item.size && (
                    <Badge variant="outline" className="border-border">
                      Size: {item.size}
                    </Badge>
                  )}
                </div>

                {/* Price Display */}
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">
                    ${item.price.toFixed(2)}
                  </span>
                  {item.originalPrice && item.originalPrice > item.price && (
                    <>
                      <span className="text-lg text-muted-foreground line-through">
                        ${item.originalPrice.toFixed(2)}
                      </span>
                      <Badge className="bg-accent/20 text-accent border-accent/20">
                        Save ${(item.originalPrice - item.price).toFixed(2)}
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    disabled={isUpdating || item.quantity <= 1}
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full border-border hover:border-primary"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  
                  <div className="relative">
                    <Input
                      type="number"
                      className="w-16 text-center bg-input border-border"
                      value={item.quantity}
                      onChange={(e) => 
                        onUpdateQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1))
                      }
                      min="1"
                      max="99"
                    />
                    <div className="absolute inset-y-0 right-2 flex items-center">
                      <span className="text-xs text-muted-foreground">qty</span>
                    </div>
                  </div>
                  
                  <Button
                    disabled={isUpdating}
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full border-border hover:border-primary"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          disabled={isUpdating}
                          onClick={() => onRemove(item.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Remove from cart</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Save for later</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            {/* Item Total */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
              <span className="text-sm text-muted-foreground">Item Total</span>
              <span className="text-xl font-bold text-primary">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 2. Cart Summary Component
interface CartSummaryProps {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
  onCheckout: () => void;
  onContinueShopping: () => void;
}

function CartSummary({ 
  subtotal, 
  shipping, 
  tax, 
  total, 
  itemCount,
  onCheckout, 
  onContinueShopping 
}: CartSummaryProps) {
  const discount = subtotal > 100 ? subtotal * 0.1 : 0; // 10% discount for orders over $100
  
  return (
    <Card className="glass-effect border border-glass-border sticky top-8">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Order Summary</h3>
            <p className="text-sm text-muted-foreground">{itemCount} items in cart</p>
          </div>
        </div>

        {/* Summary Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          
          {discount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-success flex items-center gap-1">
                <Gift className="h-4 w-4" />
                Discount (10%)
              </span>
              <span className="font-medium text-success">-${discount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium">
              {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Estimated Tax</span>
            <span className="font-medium">${tax.toFixed(2)}</span>
          </div>
          
          <div className="h-px bg-border my-2" />
          
          <div className="flex items-center justify-between text-lg font-bold">
            <span className="text-foreground">Total</span>
            <span className="text-2xl text-primary">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Progress to Free Shipping */}
        {subtotal < 100 && (
          <div className="mt-6 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Free shipping on orders over $100
              </span>
              <span className="text-sm text-primary">
                ${(100 - subtotal).toFixed(2)} away
              </span>
            </div>
            <div className="h-2 bg-card rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                style={{ width: `${(subtotal / 100) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 mt-6">
          <Button
            onClick={onCheckout}
            className="w-full py-6 text-lg font-semibold rounded-xl transition-all duration-300"
          >
            <div className="flex items-center justify-center gap-2">
              <CreditCard className="h-5 w-5" />
              Proceed to Checkout
              <ArrowRight className="h-5 w-5" />
            </div>
          </Button>
          
          <Button
            onClick={onContinueShopping}
            variant="outline"
            className="w-full border-border hover:border-primary"
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </div>

        {/* Security Badges */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              Secure Payment
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Package className="h-3 w-3" />
              Free Returns
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Truck className="h-3 w-3" />
              Fast Shipping
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 3. Cart Empty State Component
function CartEmptyState({ onContinueShopping }: { onContinueShopping: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
            <ShoppingCart className="h-16 w-16 text-primary" />
          </div>
          <div className="absolute -inset-4 rounded-full bg-primary/5 animate-pulse"></div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-foreground">
            Your cart is empty
          </h2>
          <p className="text-muted-foreground">
            Add some futuristic products to get started
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={onContinueShopping}
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary-light hover:to-secondary-light text-primary-foreground"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Start Shopping
          </Button>
          
          <Button variant="outline" className="border-border">
            <TrendingUp className="h-4 w-4 mr-2" />
            View Trending
          </Button>
        </div>
        
        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass-effect border border-glass-border">
            <CardContent className="p-4">
              <Package className="h-8 w-8 text-primary mb-2" />
              <h4 className="font-medium text-foreground">New Arrivals</h4>
              <p className="text-sm text-muted-foreground">Latest futuristic products</p>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border border-glass-border">
            <CardContent className="p-4">
              <Zap className="h-8 w-8 text-secondary mb-2" />
              <h4 className="font-medium text-foreground">Best Sellers</h4>
              <p className="text-sm text-muted-foreground">Most popular items</p>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border border-glass-border">
            <CardContent className="p-4">
              <Gift className="h-8 w-8 text-accent mb-2" />
              <h4 className="font-medium text-foreground">Special Offers</h4>
              <p className="text-sm text-muted-foreground">Exclusive discounts</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// 4. Loading Skeleton Component
function CartLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items Skeleton */}
        <div className="flex-1 space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-24 w-24 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Summary Skeleton */}
        <div className="lg:w-96">
          <Card className="border-border">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-1/2" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

// Helper function for type safety
function getCartItems(items: any): any[] {
  if (Array.isArray(items)) return items;
  if (items?.items && Array.isArray(items.items)) return items.items;
  if (items?.data?.items && Array.isArray(items.data.items)) return items.data.items;
  return [];
}

function UserCartPage() {
  const {
    fetchCart,
    items,
    isLoading,
    updateCartItemQuantity,
    removeFromCart,
  } = useCartStore();
  const { user } = useAuthStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    fetchCart();
  }, [fetchCart]);

  // Redirect if not authenticated
  useEffect(() => {
    if (isMounted && !user && !isLoading) {
      router.push("/auth/login");
    }
  }, [user, isLoading, isMounted, router]);

  const handleUpdateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setIsUpdating(true);
    try {
      await updateCartItemQuantity(id, newQuantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async (id: string) => {
    setIsUpdating(true);
    try {
      await removeFromCart(id);
    } finally {
      setIsUpdating(false);
    }
  };

  // Get cart items safely
  const cartItems = getCartItems(items);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  // Show loading skeleton
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-card/20 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <CartLoadingSkeleton />
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card/20 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <header className="glass-effect rounded-2xl p-6 mb-8 border border-glass-border">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -inset-2 rounded-xl bg-primary/20 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Your Shopping Cart
                </h1>
                <p className="text-muted-foreground">
                  Review and manage your futuristic selections
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-primary text-primary">
                <Package className="h-3 w-3 mr-1" />
                {itemCount} Items
              </Badge>
              
              <Button
                onClick={fetchCart}
                variant="outline"
                size="icon"
                className="border-border hover:border-primary"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        {cartItems.length === 0 ? (
          <CartEmptyState onContinueShopping={() => router.push("/listing")} />
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">
                  Your Items ({itemCount})
                </h2>
                <Button
                  onClick={() => router.push("/listing")}
                  variant="ghost"
                  className="text-primary hover:text-primary-light"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add More Items
                </Button>
              </div>

              <div className="space-y-4">
                {cartItems.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                    isUpdating={isUpdating}
                  />
                ))}
              </div>

              {/* Cart Actions */}
              <Card className="glass-effect border border-glass-border">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-warning" />
                      <p className="text-sm text-muted-foreground">
                        Items will be reserved for 30 minutes
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => router.push("/wishlist")}
                        variant="outline"
                        className="border-border"
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        Save All to Wishlist
                      </Button>
                      
                      <Button
                        onClick={() => {
                          if (confirm("Clear all items from cart?")) {
                            cartItems.forEach(item => handleRemoveItem(item.id));
                          }
                        }}
                        variant="outline"
                        className="border-destructive/20 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Cart
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cart Summary */}
            <div className="lg:w-96">
              <CartSummary
                subtotal={subtotal}
                shipping={shipping}
                tax={tax}
                total={total}
                itemCount={itemCount}
                onCheckout={() => router.push("/checkout")}
                onContinueShopping={() => router.push("/listing")}
              />

              {/* Promo Code */}
              <Card className="mt-4 glass-effect border border-glass-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Gift className="h-4 w-4 text-accent" />
                    <h4 className="font-medium text-foreground">Promo Code</h4>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      className="bg-input border-border"
                    />
                    <Button variant="outline" className="border-border">
                      Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Badges */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="glass-effect rounded-lg p-3 border border-glass-border flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-xs text-muted-foreground">30-Day Returns</span>
                </div>
                <div className="glass-effect rounded-lg p-3 border border-glass-border flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Secure Payment</span>
                </div>
                <div className="glass-effect rounded-lg p-3 border border-glass-border flex items-center gap-2">
                  <Truck className="h-4 w-4 text-secondary" />
                  <span className="text-xs text-muted-foreground">Free Shipping</span>
                </div>
                <div className="glass-effect rounded-lg p-3 border border-glass-border flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span className="text-xs text-muted-foreground">Quality Guarantee</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserCartPage;