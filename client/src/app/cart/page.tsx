// app/cart/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// ✅ Add this type guard function
function getCartItems(items: any): any[] {
  if (Array.isArray(items)) {
    return items;
  }
  
  if (items && typeof items === 'object' && Array.isArray(items.items)) {
    return items.items;
  }
  
  if (items && typeof items === 'object' && items.data && Array.isArray(items.data.items)) {
    return items.data.items;
  }
  
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

  const handleUpdateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setIsUpdating(true);
    await updateCartItemQuantity(id, newQuantity);
    setIsUpdating(false);
  };

  const handleRemoveItem = async (id: string) => {
    setIsUpdating(true);
    await removeFromCart(id);
    setIsUpdating(false);
  };

  // ✅ FIX: Use the type-safe function
  const cartItems = getCartItems(items);
  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">YOUR CART</h1>
        
        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
            <Button onClick={() => router.push("/listing")}>
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-4 px-4">PRODUCT</th>
                    <th className="text-right py-4 px-4">PRICE</th>
                    <th className="text-center py-4 px-4">QUANTITY</th>
                    <th className="text-right py-4 px-4">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-20 h-20 object-cover"
                          />
                          <div>
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="text-sm text-gray-700">
                              Color: {item.color}
                            </p>
                            <p className="text-sm text-gray-700">Size: {item.size}</p>
                            <Button
                              disabled={isUpdating}
                              onClick={() => handleRemoveItem(item.id)}
                              variant="destructive"
                              size="sm"
                              className="mt-2"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        ${item.price.toFixed(2)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            disabled={isUpdating || item.quantity <= 1}
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity - 1)
                            }
                            variant="outline"
                            size="icon"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            className="w-16 text-center"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateQuantity(
                                item.id,
                                parseInt(e.target.value) || 1
                              )
                            }
                            min="1"
                          />
                          <Button
                            disabled={isUpdating}
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity + 1)
                            }
                            variant="outline"
                            size="icon"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        ${(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-8 flex justify-end">
              <div className="space-y-4 w-80">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-medium">TOTAL</span>
                  <span className="font-bold">${total.toFixed(2)}</span>
                </div>
                <Button
                  onClick={() => router.push("/checkout")}
                  className="w-full bg-black text-white hover:bg-gray-800"
                >
                  PROCEED TO CHECKOUT
                </Button>
                <Button
                  onClick={() => router.push("/listing")}
                  className="w-full"
                  variant="outline"
                >
                  CONTINUE SHOPPING
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default UserCartPage;