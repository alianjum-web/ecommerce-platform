import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import CheckoutComponent from "./CheckoutComponent";

function CheckoutSkeleton() {
  return (
    <div>
      <Skeleton />
    </div>
  );
}

function CheckoutSuspense() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutComponent />
    </Suspense>
  );
}

export default CheckoutSuspense;