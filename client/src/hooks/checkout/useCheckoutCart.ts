import { useEffect, useState, useCallback } from 'react';
import { CartItem, CartItemWithProduct } from '@/types/cart/cartItemStore';

export const useCheckoutCart = (items: CartItem[]) => {
  const [cartItemsWithDetails, setCartItemsWithDetails] = useState<CartItemWithProduct[]>([]);

  const convertToCartItemWithProduct = useCallback((item: CartItem): CartItemWithProduct => ({
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
  }), []);

  useEffect(() => {
    console.log("🔄 Processing cart items:", items);

    if (!Array.isArray(items)) {
      console.error("Items is not an array:", items);
      setCartItemsWithDetails([]);
      return;
    }

    if (items.length === 0) {
      setCartItemsWithDetails([]);
      return;
    }

    const convertedItems = items.map(convertToCartItemWithProduct);
    setCartItemsWithDetails(convertedItems);
  }, [items, convertToCartItemWithProduct]);

  return { cartItemsWithDetails };
};