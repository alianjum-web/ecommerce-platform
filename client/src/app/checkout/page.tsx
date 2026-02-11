"use client";

import { FuturisticCheckoutLoader } from "@/hooks/checkout/FuturisticCheckoutLoader";
import { PayPalProviderWrapper } from "@/hooks/checkout/PayPalProviderWrapper";
import { Suspense } from "react";
import dynamic from "next/dynamic";


const CheckoutContent = dynamic(() => import("@/components/user/checkout/CheckoutComponent"), {
  ssr: false,
  loading: () => <FuturisticCheckoutLoader />,
});

function CheckoutPage() {
  return (
      <PayPalProviderWrapper>
        <Suspense fallback={<FuturisticCheckoutLoader />}>
          <CheckoutContent />
        </Suspense>
      </PayPalProviderWrapper>
  );
}

export default CheckoutPage;