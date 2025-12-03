import { Coupon } from "../checkout/Coupon";

export interface OrderSummaryProps {
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