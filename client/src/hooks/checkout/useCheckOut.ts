// hooks/useCheckout.ts
import { useState, useEffect, useCallback } from "react";
import { useAddressStore } from "@/store/useAddressStore";
import { useCartStore } from "@/store/useCartStore";
import { useCouponStore } from "@/store/useCouponStore";
import { useProductStore } from "@/store/useProductStore";

export const useCheckout = () => {
  const { addresses, fetchAddresses } = useAddressStore();
  const { items, fetchCart } = useCartStore();
  const { getProductById } = useProductStore();
  const { fetchCoupons, couponList } = useCouponStore();
  
  const [selectedAddress, setSelectedAddress] = useState("");
  const [cartItemsWithDetails, setCartItemsWithDetails] = useState<any[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initCheckout = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchAddresses(), fetchCart(), fetchCoupons()]);
      } catch (error) {
        console.error("Failed to initialize checkout:", error);
      } finally {
        setIsLoading(false);
      }
    };
    initCheckout();
  }, [fetchAddresses, fetchCart, fetchCoupons]);

  useEffect(() => {
    const findDefaultAddress = addresses.find((address) => address.isDefault);
    if (findDefaultAddress) {
      setSelectedAddress(findDefaultAddress.id);
    }
  }, [addresses]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      const itemsWithDetails = await Promise.all(
        items.map(async (item) => {
          const product = await getProductById(item.productId);
          return { ...item, product };
        })
      );
      setCartItemsWithDetails(itemsWithDetails);
    };
    fetchProductDetails();
  }, [items, getProductById]);

  const handleApplyCoupon = useCallback(() => {
    const getCurrentCoupon = couponList.find((c) => c.code === couponCode);
    
    if (!getCurrentCoupon) {
      setCouponError("Invalid coupon code");
      setAppliedCoupon(null);
      return;
    }

    const now = new Date();
    if (now < new Date(getCurrentCoupon.startDate) || now > new Date(getCurrentCoupon.endDate)) {
      setCouponError("Coupon is not valid or has expired");
      setAppliedCoupon(null);
      return;
    }

    if (getCurrentCoupon.usageCount >= getCurrentCoupon.usageLimit) {
      setCouponError("Coupon has reached its usage limit");
      setAppliedCoupon(null);
      return;
    }

    setAppliedCoupon(getCurrentCoupon);
    setCouponError("");
  }, [couponCode, couponList]);

  const subtotal = cartItemsWithDetails.reduce(
    (acc, item) => acc + (item.product?.price || 0) * item.quantity,
    0
  );

  const discountAmount = appliedCoupon
    ? (subtotal * appliedCoupon.discountPercent) / 100
    : 0;

  const total = subtotal - discountAmount;

  return {
    addresses,
    selectedAddress,
    setSelectedAddress,
    cartItemsWithDetails,
    appliedCoupon,
    couponCode,
    couponError,
    setCouponCode,
    handleApplyCoupon,
    subtotal,
    discountAmount,
    total,
    isLoading,
  };
};