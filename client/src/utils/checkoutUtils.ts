import { CartItemWithProduct } from '@/types/cart/cartItemStore';
import type { Coupon } from '@/types/checkout';

export const calculateTotals = (
  cartItems: CartItemWithProduct[],
  appliedCoupon: Coupon | null
) => {
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  const discountAmount = appliedCoupon
    ? (subtotal * appliedCoupon.discountPercent) / 100
    : 0;

  const total = Math.max(0, subtotal - discountAmount);

  return { subtotal, discountAmount, total };
};

export const isCheckoutReady = (
  selectedAddress: string,
  cartItems: CartItemWithProduct[]
): boolean => {
  return Boolean(selectedAddress && cartItems.length > 0);
};